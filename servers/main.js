/**
형태소 분석
*/

// require
const Koa = require('koa');
const Router = require('koa-router');
//const bodyParser = require("body-parser"); // Body parser for fetch posted data
//const websocket = require('websocket'); // websocket (http://ahoj.io/nodejs-and-websocket-simple-chat-tutorial, https://www.npmjs.com/package/websocket)
//const mecab = require('mecab-ya'); // 형태소분석 - https://github.com/golbin/node-mecab-ya, https://bitbucket.org/eunjeon/mecab-ko/

const env = require('../config/env');
const paths = require('../config/paths');
const mecab = require('../mecab.js'); // https://bitbucket.org/eunjeon/mecab-ko/

// Koa
const app = new Koa();
const router = new Router();

// middleware
app.use(router.routes());
app.use(router.allowedMethods());

// route
router.get('/', (ctx, next) => {
	// ctx.params; // 라우트 경로에서 :파라미터명 으로 정의된 값이 ctx.params 안에 설정됩니다.
	// ctx.request.query; // 주소 뒤에 ?id=10 이런식으로 작성된 쿼리는 ctx.request.query 에 파싱됩니다.
	ctx.body = '홈';
});
router.get('/route', require('../routes/main').routes());

//
let text = '아버지가방에들어가신다';
console.log(mecab.parse(text));

// 서버 실행
app.listen(env.port);