#!/bin/sh

OSNAME=$(uname -a)
echo $OSNAME

if [[ $OSNAME == *"Ubuntu"* ]]
then
	echo "Ubuntu detected, installing prerequisites for node-canvas"
	sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++
fi

if [[ $OSNAME == *"Fedora"* ]]
then
	echo "Fedora detected, installing prerequisites for node-canvas"
	sudo yum install cairo cairo-devel cairomm-devel libjpeg-turbo-devel pango pango-devel pangomm pangomm-devel giflib-devel
fi

if [[ $OSNAME == *"Solaris"* ]]
then
	echo "Solaris detected, installing prerequisites for node-canvas"
	sudo yum install cairo cairo-devel cairomm-devel libjpeg-turbo-devel pango pango-devel pangomm pangomm-devel giflib-devel
fi

if [[ $OSNAME == *"Darwin"* ]]
then
	echo "OSX detected, installing prerequisites for node-canvas"
	brew install pkg-config cairo pango libpng jpeg giflib
fi