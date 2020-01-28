This program need two services. One PHP server port 8080 to test the websites, and another server port 8910 for development.
The server on port 8080 is Apache using PHP as backend language. The server on port 8910 is a jupyter notebook to develop html codes

Need to periodically update the apache www folder, to refesh the website (port 8080):
sudo cp -r /home/anguyen139/public/www/ /var/www/html
