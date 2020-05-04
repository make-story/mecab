# 도커 이미지 생성을 위한 설정파일 
# '.dockerignore' 파일에 Docker 이미지 생성 시 이미지안에 들어가지 않을 파일을 지정

# base image
FROM hephaex/ubuntu

# mecab
# 의존성 설치 (apk, apt-get, yum 등 OS에 맞는 패키지 관리자 활용하여 설치)
RUN apt-get update \
#	&& apt-get upgrade -y \
	&& apt-get install -y automake perl build-essential \
	&& apt-get install -y autotools-dev autoconf \
	&& apt-get install -y python3 python3-pip curl sudo cron
#RUN apt-get install -y openjdk-8-jdk git 

# 언어팩 설정을 하기 위해 가장 많이 지원되는 en_US.UTF-8 을 시스템 언어로 지정
#RUN apt-get install -y language-pack-ko 
#RUN locale-gen en_US.UTF-8 && update-locale LANG=en_US.UTF-8

#RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# set working directory - 작업 디렉토리 생성 및 고정
WORKDIR /app
COPY . /app/

# mecab-ko
RUN tar xvfz mecab-0.996-ko-0.9.2.tar.gz
WORKDIR /app/mecab-0.996-ko-0.9.2
RUN ./configure && make && make check && make install

WORKDIR /app

# mecab-ko-dic
RUN tar xvfz mecab-ko-dic-2.1.1-20180720.tar.gz
WORKDIR /app/mecab-ko-dic-2.1.1-20180720
# automake 버전 문제로 설치 도중 에러가 나는 경우
RUN autoreconf -vi
RUN ./autogen.sh
# libmecab.so.2를 찾을 수 없는 에러가 나는 경우
RUN sudo ldconfig 
RUN ./configure && make && sudo make install

WORKDIR /app

CMD ["mecab" "안녕하세요."]

# $ docker build -t makestory/mecab:latest .
# $ docker run --name mecab makestory/mecab:latest

# https://beomi.github.io/2019/12/20/DockerImage_for_KoreanNLP/
# Kakao에서 발표한 CNN기반 토크나이저인 Khaiii
#WORKDIR /deps
#RUN git clone https://github.com/kakao/khaiii.git
#WORKDIR /deps/khaiii
#RUN pip install cython \
#    && pip install --upgrade pip \
#    && pip install -r requirements.txt \
#    && mkdir build
#WORKDIR /deps/khaiii/build
#RUN cmake .. && make all && make resource && make install && make package_python
#WORKDIR /deps/khaiii/build/package_python
#RUN pip install .

