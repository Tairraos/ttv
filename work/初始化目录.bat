@echo off

echo ����Ŀ¼�Ѿ�׼����...

cd ..

if not exist "media" mkdir "media"
echo ý���ļ�Ŀ¼׼����� media

cd media

if not exist "archive" mkdir "archive"
echo �浵Ŀ¼׼����� media\archive ����ù����ز�

if not exist "common" mkdir "common"
echo �����ļ�Ŀ¼׼����� media\common ��ŵ��ǹ����ļ���ding ������Ƭͷ

if not exist "common\ding.m4a" copy "..\work\ding.m4a" "common\ding.m4a"
if not exist "common\intro-cn.mp4" copy "..\work\intro-cn.mp4" "common\intro-cn.mp4"
if not exist "common\intro-en.mp4" copy "..\work\intro-en.mp4" "common\intro-en.mp4"
echo �����ļ��Ѿ�׼���� media\dist\*.*

if not exist "dist" mkdir "dist"
echo Ŀ�����Ŀ¼׼����� media\dist ��ŵ���������ɵ� mp4 �ļ�

if not exist "images" mkdir "images"
echo ͼƬĿ¼׼����� media\images ��ŵ�δʹ�ù��ı���ͼƬ

if not exist "material" mkdir "material"
echo �ز�Ŀ¼׼����� media\material ��ŵ���������Ƶ�����в������ز�

cd material
if not exist "audio" mkdir "audio"
if not exist "video" mkdir "video"
if not exist "slide" mkdir "slide"

echo ����Ŀ¼׼�����

pause
