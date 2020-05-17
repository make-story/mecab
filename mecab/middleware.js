/*
MeCab 을 사용한 자체 모듈 
https://bitbucket.org/eunjeon/mecab-ko-dic/src/master/

-
MAC 설치시
brew 설치하고, GCC 설치 
$ brew install gcc

-
GCC
GNU Compiler Collection, 컴파일러

make
파일 간의 종속관계를 파악하여 Makefile( 기술파일 )에 적힌 대로 컴파일러에 명령하여 SHELL 명령이 순차적으로 실행될 수 있게 합니다.

-
일부 Mac 오래된 OS 버전에서 GCC 설치가 오래걸릴 수 있다.
https://stackoverflow.com/questions/24966404/brew-install-gcc-too-time-consuming

-
mecab-ko 설치
https://bitbucket.org/eunjeon/mecab-ko/downloads/
$ tar xvfz mecab-0.996-ko-0.9.2.tar.gz
$ cd mecab-0.996-ko-0.9.2
$ ./configure
$ make
$ make check
$ sudo make install

/usr/bin/install -c -m 644 mecabrc ‘/usr/local/etc’ 메시지 출력시 설치완료

-
mecab-ko-dic 설치
https://bitbucket.org/eunjeon/mecab-ko-dic/downloads/
$ tar xvfz mecab-ko-dic-2.1.1-20180720.tar.gz
$ cd mecab-ko-dic-2.1.1-20180720
$ ./configure
$ make
$ sudo make install

/usr/bin/install -c -m 644 model.bin matrix.bin char.bin sys.dic unk.dic left-id.def right-id.def rewrite.def pos-id.def dicrc ‘/usr/local/lib/mecab/dic/mecab-ko-dic’ 메시지 출력시 설치완료

-
mecab-ko-dic 설치 중 에러
configure.ac:2: error: possibly undefined macro: AM_INIT_AUTOMAKE
$ cd mecab-ko-dic-2.1.1-20180720
$ ./autogen.sh
$ configure
$ make
$ su
$ make install

-
실행
$ mecab -d /usr/local/lib/mecab/dic/mecab-ko-dic
*/
const execSync = require('child_process').execSync;
const quote = require('shell-quote').quote;
const fs = require('fs');

// mecab 실행 위치
const MECAB = 'mecab'; 

// 결과 반환 방식 - 동사(Verb), 형용사(Adjective) 제외
const TYPE_POS = 'pos'; // 품사
const TYPE_MORPHS = 'morphs'; // 형태소
const TYPE_NOUNS = 'nouns'; // 명사 
exports.TYPE_POS = TYPE_POS;
exports.TYPE_MORPHS = TYPE_MORPHS;
exports.TYPE_NOUNS = TYPE_NOUNS;

// 결과 파일로 저장 후 반환
const parseFile = (text='') => {
	const command = ['mecab', 'TMP_INPUT_FILE', '--output=TMP_OUTPUT_FILE'].join(' ');
	let result = [];
	let lines;

	// 결과를 임시 파일에 저장
	text += '\n';
	fs.writeFileSync('TMP_INPUT_FILE', text, 'UTF-8');

	try {
		execSync(command, { encoding: 'UTF-8' });
		result = fs.readFileSync('TMP_OUTPUT_FILE', 'UTF-8');
	}catch(e) {
		console.log(e);
	}

	result = result.replace(/\r/g, '');
	result = result.replace(/\s+$/, '');

	lines = result.split('\n');
	result = lines.map(line => {
		return line.replace('\t', ',').split(',');
	});

	return result;
};

// 커맨드 echo 결과물 반환 
const parseEcho = (method=TYPE_POS) => (text='') => {
	let command = [quote(['echo', text]), '|', MECAB].join(' ');
	let result = execSync(command, { encoding: 'UTF-8' });
	// echo 명령으로 출력된 결과물 확인 
	// \n : 줄 바꿈 (Enter), \t : 탭 (Tab)
	//console.log('command$ ', command);
	return result.split('\n').reduce((accumulator, currentValue/*line 단위 데이터*/, currentIndex, original) => {
		let arr = currentValue.split('\t'); // [ '아버지', 'NNG,*,F,아버지,*,*,*,*' ]

		if(arr.length > 1) {
			// 반환 타입에 따른 작업 
			switch(method) {
				case TYPE_POS:
					accumulator.push([arr[0]].concat(arr[1].split(',')[0]));
					break;
				case TYPE_MORPHS:
					accumulator.push(arr[0]);
					break;
				case TYPE_NOUNS:
					if(['NNG', 'NNP'].includes(arr[1].split(',')[0])) {
						accumulator.push(arr[0]);
					}
					break;
			}
		}
		return accumulator;
	}, []);
};
console.log('test TYPE_POS', parseEcho(TYPE_POS)('아버지가방에들어가신다1'));
console.log('test TYPE_MORPHS', parseEcho(TYPE_MORPHS)('아버지가방에들어가신다2'));
console.log('test TYPE_NOUNS', parseEcho(TYPE_NOUNS)('아버지가방에들어가신다3'));

module.exports = {
	parse: parseEcho,
	file: parseFile,
	pos: parseEcho(TYPE_POS),
	morphs: parseEcho(TYPE_MORPHS),
	nouns: parseEcho(TYPE_NOUNS),
};