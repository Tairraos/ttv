@echo off

cd ..
if not exist "media" mkdir "media"

cd media
if not exist "archive" mkdir "archive"
if not exist "common" mkdir "common"
if not exist "dist" mkdir "dist"
if not exist "images" mkdir "images"
if not exist "material" mkdir "material"
if not exist "video" mkdir "video"
if not exist "common\ding.mp3" copy "..\work\ding.mp3" "common\ding.mp3"
if not exist "common\intro-cn.mp4" copy "..\work\intro-cn.mp4" "common\intro-cn.mp4"
if not exist "common\intro-en.mp4" copy "..\work\intro-en.mp4" "common\intro-en.mp4"

echo ����Ŀ¼�Ѿ�׼�����
echo -----------------------
echo Ŀ¼ media\dist ��ŵ���������ɵ� mp4 �ļ�
echo Ŀ¼ media\images ��ŵ�δʹ�ù��ı���ͼƬ
echo Ŀ¼ media\common ��ŵ��ǹ����ļ���ding.mp3 ��Ƭͷ mp4
echo Ŀ¼ media\material ��ŵ���������Ƶ�����в����� mp3 �� slide
echo Ŀ¼ media\video ��ŵ���������Ƶ�����в����� mp4 Ƭ��
echo Ŀ¼ media\archive ��ŵ����Ѿ��ù��ı���ͼƬ
echo -----------------------

pause
