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
	//resolveApp, // paths.resolveApp('public') 형태로 외부에서 사용자가 수동 경로설정이 가능하도록 할 경우, 추후 해당 root 경로 등 변경이 발생하면 하나하나 해당 코드가 들어있는 파일을 찾아 수정해야 한다. 
	ensureSlash,
	//dotenv: resolveApp('.env'),
	appNodeModules: resolveApp('node_modules'),
	appPackageJson: resolveApp('package.json'),
	appConfigJson: resolveApp('config/config.json'),
	appPath: resolveApp('.'),
	appConfig: resolveApp('config'),
	appSrc: resolveApp('src'),
	appWebpackOutput: ensureSlash(resolveApp(`dist/${env.active}/${env.build}/webpack`)),
	publicUrl: getPublicUrl(resolveApp('package.json')),
	servedPath: getServedPath(resolveApp('package.json')),
};