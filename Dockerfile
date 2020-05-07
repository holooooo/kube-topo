FROM nginx:1.17.7-alpine
EXPOSE 80
EXPOSE 443
COPY build /usr/share/nginx/html