FROM fedora:37

RUN mkdir /app
COPY ./server /app/
workdir /app
RUN yum -y install python pip ffmpeg-free && \
    pip install flask flask_cors gevent loguru requests bs4
EXPOSE 8088

ENTRYPOINT ["python", "/app/server.py"]
