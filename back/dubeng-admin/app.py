from flask import Flask, render_template, send_file, request, redirect, url_for, jsonify
from youtube_transcript_api import YouTubeTranscriptApi
from pydub import AudioSegment
import classes
import subprocess
from vedioInfo import getVedioId, get_video_info
from io import BytesIO
import boto3
import time
import os
import glob
from pytube import YouTube
import pymysql
import time
import re
import os
import json

from pathlib import Path
from waitress import serve


app = Flask(__name__)

# env 파일 읽어오기
f_conn = open("./env.txt")

DB_HSOT = f_conn.readline().strip()
DB_USER = f_conn.readline().strip()
DB_DATABASE_NAME = f_conn.readline().strip()
DB_CHARSET = "utf8mb4"
# CURSORCLASS = pymysql.cursors.Cursor
BUCKET_NAME = f_conn.readline().strip()
AWS_ACCESS_KEY_ID = f_conn.readline().strip()
AWS_SECRET_ACCESS_KEY = f_conn.readline().strip()
AWS_DEFAULT_REGION = 'ap-northeast-2'

f_conn.close()


def cleanDownloadFolder(userId):
    time.sleep(3)
    path = './download/dwn/output/'+userId+'/*'
    if os.path.exists('download/dwn/output/'+userId):
        dwnDir = glob.glob(path)
        for file in dwnDir:
            os.remove(file)
        print('i cleaned the download directory.')
        path = './download/dwn/'+userId+'.mp3'
        if os.path.exists(path):
            os.remove(path)
            print('i cleaned the original mp3')
            return True
    return False


def deletIllegalSymbols(name):
    # 허용되지 않는 문자 제거
    name = re.sub(r'[^\w\s-]', '', name).strip()
    # 공백을 언더바로 변경
    name = re.sub(r'\s+', '_', name)
    return name


# 장르/상황 카테고리 목록 가져오는 함수
def getCategories():
    categories = []  # DB에서 가져온 카테고리 정보를 저장할 객체를 담을 리스트

    # DB 연결
    cursorclass = pymysql.cursors.Cursor
    connection = pymysql.connect(
        host=DB_HSOT, user=DB_USER, database=DB_DATABASE_NAME, charset=DB_CHARSET, cursorclass=cursorclass)
    cursor = connection.cursor()

    # 카테고리 테이블에서 정보 얻어오기
    sql = "select * from category"
    cursor.execute(sql)
    rows = cursor.fetchall()

    for r in rows:
        id = r[0]
        cate = {
            "id": id,
            "name": r[1]
        }
        categories.append(cate)

    connection.commit()
    connection.close()

    return categories


def uploadToBucket(filePath, uploadName):
    key = uploadName
   # 음원 데이터를 메모리 내에서 처리하기 위해 BytesIO 객체 생성
    audio_bytesio = BytesIO()

    # AudioSegment 객체 생성
    audio_segment = AudioSegment.from_file(filePath)

    # AudioSegment 객체를 BytesIO에 기록
    audio_segment.export(audio_bytesio, format="wav")

    # BytesIO에서 바이트 스트림 읽어오기
    audio_bytes = audio_bytesio.getvalue()

    client = boto3.client('s3', aws_access_key_id=AWS_ACCESS_KEY_ID,
                          aws_secret_access_key=AWS_SECRET_ACCESS_KEY, region_name=AWS_DEFAULT_REGION)

    client.upload_fileobj(BytesIO(audio_bytes), BUCKET_NAME, key)

    url = f"https://{BUCKET_NAME}.s3.{AWS_DEFAULT_REGION}.amazonaws.com/{key}"

    return url


# 비디오 및 스크립트 Table에 저장하는 함수
def saveVideoAndScript(video, scripts, userId, categories, file_exist):
    # DB 연결
    cursorclass = pymysql.cursors.Cursor
    connection = pymysql.connect(
        host=DB_HSOT, user=DB_USER, database=DB_DATABASE_NAME, charset=DB_CHARSET, cursorclass=cursorclass)
    cursor = connection.cursor()
    duration = int(video['endTime'])-int(video['startTime'])
    sql = "INSERT INTO video (title, runtime, video_path, thumbnail, start_time, end_time, producer, gender, lang_type) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"
    values = (video['title'], str(duration), video['video_path'], video['thumbnail'], video['startTime'],
              video['endTime'], video['producer'], video['gender'], video['lang'])
    cursor.execute(sql, values)

    print(cursor.lastrowid)

    videoId = cursor.lastrowid
    for sc in scripts:
        sql = "INSERT INTO script (start_time, duration, content, translate_content, video_id, is_dub) VALUES (%s, %s, %s, %s, %s, %s)"
        values = (sc['start_time'], sc['duration'], sc['content'],
                  sc['translate_content'], videoId, sc['is_dub'])
        cursor.execute(sql, values)

    for cate in categories:
        sql = "insert into video_category (video_id, category_id) values (%s, %s)"
        values = (videoId, cate['id'])
        cursor.execute(sql, values)

    data = seperateMp3(video['video_path'], userId, video['title'], file_exist)
    if data is not None:
        sql = "UPDATE video SET background_path=%s, voice_path=%s WHERE id=%s"
        cursor.execute(sql, (data['backUrl'], data['vocalUrl'], videoId))

        connection.commit()
        connection.close()

        return True
    else:
        return False


# 음원 추출 및 분리하는 함수
def seperateMp3(url, userId, videoTitle, file_exist):
    import os
    cnt = 0
    newname = userId+'.mp3'
    # pytube로 영상 정보 가져오기
    yt = YouTube(url, on_progress_callback=None)
    result = None
    if file_exist == False:
        # 가져와질 때까지 retry...
        while True:
            try:
                # userId의 이름으로 영상 저장

                yt.streams.filter(only_audio=True).first().download(
                    output_path='download/dwn', filename=newname)
                break

            except:
                if cnt > 25:
                    return result
                time.sleep(2)
                yt = YouTube(url, on_progress_callback=None)
                cnt += 1
                print('retrying....', cnt)
                continue

    # 음원이 저장된 경로로 이동
    path = "./download/dwn/"
    os.chdir(path)

    # 배경음과 보컬 분리해서 로컬에 저장
    print('기다려주세요.')
    spl = r'spleeter separate -p spleeter:2stems -o output '+newname
    os.system(spl)
    print("--------------------")

    # 로컬 음원 S3 버킷 업로드
    videoTitle = deletIllegalSymbols(videoTitle)
    backgroundPath = "./output/"+userId+"/accompaniment.wav"
    backgroundName = userId+"_"+videoTitle+"_accompaniment.wav"
    vocalPath = "./output/"+userId+"/vocals.wav"
    vocalName = userId+"_"+videoTitle+"_vocals.wav"

    backUrl = uploadToBucket(backgroundPath, backgroundName)
    vocalUrl = uploadToBucket(vocalPath, vocalName)
    result = {
        "backUrl": backUrl,
        "vocalUrl": vocalUrl
    }
    # os.chdir('/dubeng-admin')

    return result


# 영상 정보 불러오기 (기본정보 및 스크립트)
@app.route('/admin/videoInfo/<start>/<end>', methods=['GET'])
def sendInfo(start, end):
    url = request.args.get('url')
    lang = request.args.get('lang')
    # url 뒤에 있는 video id 추출 -> script 불러올 때 필요한 video Id
    video_id = getVedioId(url)
    print(url)
    # video 정보 가져오기
    data = get_video_info(url)
    result = list()

    if lang == 'english':
        # script 가져오기
        sc = YouTubeTranscriptApi.get_transcript(video_id)
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        transcript = transcript_list.find_transcript(['en'])
        translated_transcript = transcript.translate(
            'ko').fetch()  # 한국어 script

        for s, t in zip(sc, translated_transcript):
            if float(s['start']) >= float(start) and float(s['start']) <= float(end):
                s['translation'] = t['text']
                result.append(s)
            elif s['start'] > float(end):
                break
    response = {
        "vedioInfo": data,
        "scripts": result,
    }
    return response


@app.route('/admin/saveVedio', methods=['POST'])
def saveApi():
    req = json.loads(request.form.get('data'))
    print(req)
    video = req.get('video')
    scripts = req.get('scripts')
    userId = req.get('userId')
    categories = req.get('categories')

    file_exist = False
    if 'file' in request.files:
        file = request.files['file']
        if file.filename == '':
            print('파일이 없습니다.')
            file_exist = False
        else:
            file.save('download/dwn/'+userId+'.mp3')
            file_exist = True
    print(file_exist)
    flag = saveVideoAndScript(video, scripts, userId, categories, file_exist)
    if flag:
        cleanDownloadFolder(userId)
        return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}
    elif flag == False:
        return json.dumps({'success': "False, Tried too many. Save again."}), 405, {'ContentType': 'application/json'}
    return json.dumps({'success': False}), 405, {'ContentType': 'application/json'}


@ app.route('/admin/download', methods=['POST', 'GET'])
def downloadApi():
    url = request.get_json()['url']
    seperateMp3(url, "39576", "testTitle")

    return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}


@ app.route('/admin/cleanDir', methods=['POST', 'GET'])
def cleanDir():
    userId = request.args.get('userId')
    if cleanDownloadFolder(userId):
        return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}

    else:
        return json.dumps({'success': "Not Found Dir or File"}), 405, {'ContentType': 'application/json'}


@ app.route('/category', methods=['GET'])
def getCate():
    try:
        result = getCategories()
    except:
        return json.dumps({'success': "not found"}), 404, {'ContentType': 'application/json'}
    return jsonify(result)


if __name__ == '__main__':
    app.run('0.0.0.0', port=5000, debug=True)


def flaskRun():
    app.run(debug=True)