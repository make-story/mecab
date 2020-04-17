const path = require('path');
const fs = require('fs');

// Make sure any symlinks in the project folder are resolved:
// https://github.com/facebook/create-react-app/issues/637
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

//console.log(__dirname); // __dirname 현재 실행한 파일의 Path
//console.log(__filename); // __filename 현재 실행한 파일의 이름과 Path
console.log('src', resolveApp('src')); // /Users/ysm0203/Development/node/mecab.git/src

module.exports = {
	resolveApp,
	//dotenv: resolveApp('.env'),
	appNodeModules: resolveApp('node_modules'),
	appPackageJson: resolveApp('package.json'),
	appPath: resolveApp('.'),
	appSrc: resolveApp('src'),
};