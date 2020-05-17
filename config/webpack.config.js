// 모듈
const path = require('path'); 
const webpackMerge = require('webpack-merge'); // 여러 웹팩 설정값 결합 - webpackMerge({설정1}, {설정2}, ...)
const paths = require(path.resolve(__dirname, './paths'));
const env = require(path.resolve(__dirname, './env'));
const manifestWrite = require(path.resolve(__dirname, './manifest-write'));

// webpack plugin 
const ManifestPlugin = require('webpack-manifest-plugin'); // 빌드 결과 json 생성 

// webpack config (웹팩설정 정보)
const configBase = require('./webpack.base.js'); // 공통설정 (기본 프로젝트)
const configProduction = require('./webpack.production.js'); // 웹팩 배포용 설정 
const configDevelopment = require('./webpack.development.js'); // 웹팩 개발모드 설정 

// 경로
const PATHS = {
	// 공통경로
	PUBLIC: `${env.active}/${env.build}/webpack/`,
};

// 개발서버 관련 설정 
let setDevelopment = (config={}) => {
	if(config.mode !== 'development') {
		return config;
	}
	if(!config.devServer || typeof config.devServer !== 'object') {
		config.devServer = {};
	}
	if(env.active === env.phase.local) {
		config.devServer.open = true;
	}else {
		config.devServer.open = false;
	}
	return config;
};

// 개발환경에 따른 output 변경 
let setOutput = (config={}) => {
	// config.output 값 변경 
	switch(env.active) {
		case env.phase.local:
		case env.phase.test: // dev / qa
		case env.phase.stage:
		case env.phase.production:
		/*case 'prd':
		case 'stg':
		case 'qa':
		case 'dev':*/
			// 빌드 결과 파일위치 지정 
			config.output.path = paths.appWebpackOutput;
			if(/*env.active !== env.phase.local*/config.mode !== 'development') {
				// 필드파일명 앞에 공통으로 붙이는 경로
				//config.output.publicPath = PATHS.PUBLIC;
			}
			//config.output.filename = `[name]/[name].${getDatetime()}.js`;
			break;
	}
	console.log('[webpack] output', config.output && config.output.path || '');
	return config;
};

// 필수 플러그인 관련 설정 
let setPlugins = (config={}) => {
	config = webpackMerge(config, {
		plugins: [
			// 빌드 결과 정보가 들어있는 json 생성
			new ManifestPlugin({
				// 파일명 - manifest.json
				//fileName: `${env.active}.${env.build}.json`, 
				// 경로의 기본 경로 (기본값: output.publicPath)
				//publicPath: '',
				// 경로에 추가되는 경로
				//basePath: '/', 
				// 정보 추가
				/*seed: { 
					'active': env.active,
					'build': env.build,
				},*/
				// 필터 
				filter: function(FileDescriptor) {
					//console.log('filter');
					//console.log('FileDescriptor', FileDescriptor);
					//FileDescriptor { path: string, name: string | null, isInitial: boolean, isChunk: boolean, chunk?: Chunk, isAsset: boolean, isModuleAsset: boolean }
					//return FileDescriptor; // 기본 출력 

					if(FileDescriptor.isInitial && !FileDescriptor.name.endsWith('.map')) {
						return FileDescriptor;
					}
				},
				// 매니페스트를 만들기전 세부 사항 수정 
				map: function(FileDescriptor) { 
					//console.log('map');
					//console.log('FileDescriptor', FileDescriptor);
					//FileDescriptor { path: string, name: string | null, isInitial: boolean, isChunk: boolean, chunk?: Chunk, isAsset: boolean, isModuleAsset: boolean }
					//return FileDescriptor; // 기본 출력 
					return FileDescriptor;
				},
				// 매니페스트를 구조 변경
				// entry 단위
				generate: function(seed, files, entrypoints) {
					//console.log('generate');
					//console.log('seed', seed); // seed: {} 추가된 정보 
					//console.log('files', files); // [{path: 'page1/page1.2020111-232650.js', chunk: Chunk, name: '', ...}, {...}, ...]
					//console.log('entrypoints', entrypoints); // {page1: ['...', ...], page2: ...}

					// filter - 매니페스트에 포함될 파일만 분류 
					let manifestFiles = files.reduce((manifest/*콜백의 반환값을 누적*/, file/*현재 요소*/) => {
						// file.path: 'page1/page1.2020111-23516.js'
						// file.name: 'page1.js'
						// file.chunk
						// file.isInitial, file.isChunk, file.isAsset, file.isModuleAsset
						manifest[file.name] = file.path;
						return manifest;
					}, {});

					// 파일 단위, 확장자 단위 별로 분리 
					let entrypointFiles = {};
					let entrypointTypes = {};
					Object.keys(entrypoints).forEach(entry => {
						// entry: page1
						// entrypoints[entry]: [ 'vendors~page1/vendors~page1.2020111-23516.js', 'page1/page1.2020111-23516.js' ]

						// 리소스 타입별로 구분 
						let types = {
							/*'ico': [],
							'json': [],
							'css': [],
							'js': [],*/
						};

						// 필터 (제외할 파일 종류)
						entrypointFiles[entry] = entrypoints[entry].filter(
							fileName => !fileName.endsWith('.map')
						);

						// 확장자 별로 분류 
						entrypointFiles[entry].forEach(file => {
							//console.log('file', file); // react/react.2020118-22463.js
							//console.log('extname', path.extname(file)); // .js
							let extname = path.extname(file).replace('.', '');
							if(!Array.isArray(types[extname])) {
								types[extname] = [];
							}
							types[extname].push(file);
						});
						entrypointTypes[entry] = types;
					});

					// 엔트리 단위 매니페스트 파일 생성 
					manifestWrite.webpack(entrypointTypes);

					//console.log(manifestFiles);
					//console.log(entrypointFiles);
					//console.log(entrypointTypes);

					// serialize 함수로 아래 return 값 파라미터로 전달
					return {
						//time: getDatetime(),
						//seed: seed,
						active: env.active,
						build: env.build,
						path: PATHS.PUBLIC,
						entry: entrypointTypes,
						file: manifestFiles,
					};
				},
				// 만들어진 매니페스트를 수정
				// entry 결과물
				serialize: function(manifest) {
					//console.log('serialize', manifest);
					//return JSON.stringify(manifest, null, 2); // 기본 출력

					// 최종 manifest.json 파일 내부 결과값 
					//console.log('[webpack] manifest', manifest);
					return JSON.stringify(manifest, null, 2); // 매니페스트 파일에 쓰기 
				}
			}),
		]
	});
	return config;
};

// node 설정
process.noDeprecation = true; // 콘설에 다음과 같은 형태의 경고 'parseQuery() will be replaced with getOptions() in the next major version of loader-utils.' 로더 개발자를 위한 로그 숨김처리 

//
module.exports = (environment, argv) => {
	let mode;
	let project;
	let config = {};

	console.log('---------- ---------- webpack config start ---------- ----------');
	/*
	첫 번째 인자는 커맨드라인에서 전달해주는 --env 옵션들이 객체 형태로 전달 된다. 
	webpack.EnvironmentPlugin 나 webpack.DefinePlugin 를 이용하면 구현 코드에서도 해당 변수들을 전역에서 사용할 수 있게 해준다. 
	웹팩4 버전 이하에서는 --env 옵션을 이용해 어떤 빌드인지 구분했지만, 이제는 그럴 필요가 없어졌다. 
	두 번째 인자에는 커맨드라인에서 전달되는 모든 옵션이 객체 형태로 전달 된다. 
	*/
	// webpack cli
	//console.log('[webpack] environment-variables', environment); // cli 환경옵션, https://webpack.js.org/api/cli/#environment-options, https://webpack.js.org/guides/environment-variables/
	//console.log('[webpack] argv', argv); // cli 그 밖의 옵션, https://webpack.js.org/api/cli/#config-options
	env.buildConsoleLog();

	// argv
	// --multiple
	argv = argv && typeof argv === 'object' ? argv : {};
	mode = argv.mode || 'production';
	project = env.project || argv.project;

	// 웹팩 기본 설정 mode: 'none' | 'development' | 'production'
	console.log('[webpack] mode', mode);
	switch(mode) {
		case 'development':
			config = webpackMerge(configBase, configDevelopment); 
			//config = Object.assign({}, configBase, configDevelopment); // 배열의 경우 merge 가 아닌 가장 뒤 파라미터 값으로 초기화(기존값 지우고 마지막 값 적용)되는 형태
			break;
		case 'production':
			config = webpackMerge(configBase, configProduction); 
			//config = Object.assign({}, configBase, configProduction);
			break;
	}

	// 프로젝트별 웹팩 설정 변경 (프로젝트별로 웹팩 설정이 필요할 때)
	console.log('[webpack] project', project);
	switch(project) {
		case 'typescript':
			//config = Object.assign({}, config, configTypeScript);
			break;
	}

	// config 설정 강제변경/주입(공통설정) - output 경로 등
	config = (Array.isArray(config) ? config/*웹팩 설정을 여러개 실행할 경우*/ : [config]).map((config, index, array) => {
		config = setDevelopment(config);
		config = setOutput(config);
		config = setPlugins(config);
		return config;
	});

	//console.log('config', config);
	console.log('---------- ---------- webpack config end ---------- ----------');
	return config;
};