# Usamos Node para la etapa de desarrollo
FROM node:20-alpine

WORKDIR /app

# Copiamos archivos de configuración de paquetes
COPY package*.json /app/
RUN npm install

# Instalar Angular CLI de forma global en el contenedor
RUN npm install -g @angular/cli

# Copiar el resto del código del front
COPY . /app/

# Exponer el puerto por defecto de Angular
EXPOSE 4200

# Comando para levantar el servidor de desarrollo escuchando peticiones externas
CMD ["ng", "serve", "--host", "0.0.0.0"]