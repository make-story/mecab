const path = require('path');
const fs = require('fs');
const env = require('./env');

// Make sure any symlinks in the project folder are resolved:
// https://github.com/facebook/create-react-app/issues/637
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

// '/'
const ensureSlash = (inputPath="", isNeedsSlash=true) => {
	const isHasSlash = inputPath.endsWith('/'); // 문자열 마지막이 '/' 끝나는지 여부
	if(isHasSlash && !isNeedsSlash) { 
		// 문자열 마지막 '/' 제거값 반환
		return inputPath.substr(0, inputPath.length - 1);
	}else if(!isHasSlash && isNeedsSlash) { 
		// 문자열 마지막 '/' 붙여서 반환
		return `${inputPath}/`;
	}else {
		return inputPath;
	}
};

// public url
const getPublicUrl = appPackageJson => env.publicUrl || require(appPackageJson).homepage || '/';
const getServedPath = appPackageJson => {
	const publicUrl = getPublicUrl(appPackageJson);
	const servedUrl = env.publicUrl || (publicUrl ? url.parse(publicUrl).pathname : '/');
	return ensureSlash(servedUrl);
};

//console.log(__dirname); // __dirname 현재 실행한 파일의 Path
//console.log(__filename); // __filename 현재 실행한 파일의 이름과 Path
//console.log('src', resolveApp('src')); // /Users/ysm0203/Development/node/build.git/src
//console.log('servedPath', getServedPath(resolveApp('package.json')));

module.exports = {
	resolveApp, // node 경로/<파일명> 처럼, 명령을 실행하는 위치를 기준으로, resolveApp('<상대경로>') 파라미터로 보내는 경로를 절대경로로 변경
	ensureSlash,
	//dotenv: resolveApp('.env'),
	appNodeModules: resolveApp('node_modules'),
	appPackageJson: resolveApp('package.json'),
	appPath: resolveApp('.'),
	appConfig: resolveApp('config'),
	appSrc: resolveApp('src'),
	appWebpackOutput: ensureSlash(resolveApp(`dist/${env.active}/${env.build}/webpack`)),
	publicUrl: getPublicUrl(resolveApp('package.json')),
	servedPath: getServedPath(resolveApp('package.json')),
};