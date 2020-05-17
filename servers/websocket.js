/*
-
WebSocket Server (UI TEST 용)
https://github.com/theturtle32/WebSocket-Node/tree/master/docs
https://github.com/theturtle32/WebSocket-Node/blob/master/docs/WebSocketServer.md
https://github.com/theturtle32/WebSocket-Node/blob/master/docs/WebSocketRequest.md
https://github.com/theturtle32/WebSocket-Node/blob/master/docs/WebSocketConnection.md
*/
const express = require('express');
const websocket = require('websocket'); // https://www.npmjs.com/package/websocket
const pathMatch = require("path-match")({ sensitive: false, strict: false, end: false }); // Path-to-RegExp 기반 
const uitest = require('../headlesschrome/uitest');
const performance = require('../headlesschrome/performance');
const validator = require('../headlesschrome/validator');

// express
const app = express();

// websocket 공통 유틸
const webSocketConnections = {}; // 소켓 접속된 클라이언트 리스트
const webSocketResourceURL = {}; // 소켓 접속된 클라이언튼 URL 정보 
const webSocketError = key => callback => webSocketConnections[key] && webSocketConnections[key].on('error', error => callback && callback(error));
const webSocketClose = key => callback => webSocketConnections[key] && webSocketConnections[key].on('close', (reasonCode, description) => callback && callback(reasonCode, description));
const webSocketConnectionClose = key => () => webSocketConnections[key] && webSocketConnections[key].close();
const webSocketMessageReceive = key => callback => webSocketConnections[key] && webSocketConnections[key].on('message', message => callback && callback(message.type === 'binary' ? message.binaryData : message.utf8Data));
const webSocketMessageBroadcast = message => {
	for(let key in webSocketConnections) {
		webSocketConnections[key].send(message); // sendUTF, sendBytes, sendFrame, send
	}
};
const webSocketMessageUnicast = key => message => webSocketConnections[key] && webSocketConnections[key].send(message); // sendUTF, sendBytes, sendFrame, send
const webSocketUrlRoute = (routePath, request, handler) => {
	const match = pathMatch(routePath);
	const { key, resourceURL } = request;
	const params = match(resourceURL.pathname);
	const query = resourceURL.query || {};

	//console.log('routePath', routePath);
	//console.log('params', params);
	//console.log('query', query);
	
	if(!params) {
		return;
	}
	handler({ 
		request, 
		params, 
		query, 
		websocket: { 
			// connection
			connection: webSocketConnections[key],
			close: webSocketConnectionClose(key), 
			// close event callback
			closeEvent: webSocketClose(key),
			// error event callback
			errorEvent: webSocketError(key),
			// message
			messageReceiveEvent: webSocketMessageReceive(key), // callback
			messageBroadcast: webSocketMessageBroadcast,
			messageUnicast: webSocketMessageUnicast(key),  
		}
	});
};

// websocket server
const port = 9090;
const server = app.listen(port, () => {
	console.log('WebSocket Server', port);
});
const webSocketServer = new websocket.server({
	httpServer: server,
	autoAcceptConnections: false,
	maxReceivedFrameSize: 2170884,
	maxReceivedMessageSize: 10 * 1024 * 1024,
});

// websocket event
const webSocketRequest = request/*WebSocketRequest*/ => { 
	// 클라이언트 소켓 요청이 들어왔을 때 (사용자가 홈페이지에 접속했을 때)
	const { host/*웹소컷 서버 정보*/, origin/*사용자 접근 정보*/, resource/*리소스 접근 경로 ('/'처럼 path 정보)*/, resourceURL/*new URL() 정보*/, requestedProtocols: protocols, key/*자기자신 고유값 (key)*/, cookies/*쿠키정보 [{name, value}, ...]*/, } = request;
	
	// accept
	// https://developer.mozilla.org/ko/docs/WebSockets/Writing_WebSocket_client_applications
	// https://developer.mozilla.org/ko/docs/WebSockets/Writing_WebSocket_servers
	// http://en.wikipedia.org/wiki/Same_origin_policy
	const connection = request.accept(null/*클라이언트 new WebSocket(url, protocols) 에서 protocols 값*/, origin); // WebSocketConnection return
	const { connected/*true/false*/, state, } = connection; 

	console.log('[websocket] request!', [(new Date()), key, origin, state, connected, request.remoteAddress].join(' / ')); 
	//console.log(connection.remoteAddress + " connected - Protocol Version " + connection.webSocketVersion);
	//console.log(resource);
	//console.log(resourceURL);
	//console.log(request);
	//console.log(connection);
	
	// 유효성 검사 
	if(!key) {
		request.reject();
		return false;
	}

	// webSocketConnections 에 신규 연결정보 추가 
	webSocketConnections[key] = connection;
	webSocketResourceURL[key] = resourceURL; // search : '?url=test', query : { url: 'test' }, pathname : '/', path : '/?url=test', href : '/?url=test' 등 정보 

	// route 
	webSocketUrlRoute('/uitest/:device/cjmall/:category', request, uitest);
	webSocketUrlRoute('/performance/:device', request, performance);
	webSocketUrlRoute('/validator/:device', request, validator);

	// 공통 connection event
	connection.on('message', message => {
		console.log('[websocket] message!', [(new Date()), key, message.type].join(' / ')); 
	
		// 유효성 검사 
		if(!message || typeof message !== 'object') {
			return false;
		}
	
		// type 확인
		switch(message.type) {
			case 'utf8':
				connection.sendUTF(message.utf8Data);
				break;
			case 'binary':
				connection.sendBytes(message.binaryData);
				break;
			default:
				//console.log('[websocket] message!', message);
				break;
		}
	});
	connection.on('close', (reasonCode, description) => {
		console.log('[websocket] close!', [(new Date()), key, reasonCode, description].join(' / ')); 
	
		// 접속된 리스트에서 현재 connection 값 삭제
		key in webSocketConnections && delete webSocketConnections[key];
		key in webSocketResourceURL && delete webSocketResourceURL[key];
	});
	connection.on('error', function(error) {
		console.log('[websocket] error!', [(new Date()), connection.remoteAddress, error].join(' / ')); 
	});
};
const webSocketConnect = connection => {
	// 소켓 연결됨 
	console.log('[websocket] connect!', [(new Date()), connection.webSocketVersion].join(' / ')); 
};
//webSocketServer.on('connect', webSocketConnect);
webSocketServer.on('request', webSocketRequest);

// protocols 값(단위) 분리 라우트
// 클라이언트의 new WebSocket(url, protocols) 에서 protocols 값
/*const webSocketRouter = new websocket.router();
webSocketRouter.mount('*', 'test-socket', request => { 
	console.log('test-socket!');
});*/
