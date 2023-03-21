Corriendo con nodemon en modo fork default en puerto default:
nodemon server.js
Corriendo con nodemon en modo fork default en puerto especificado:
nodemon server.js -p 8090
Corriendo con nodemon en modo cluster en puerto default:
nodemon server.js -m CLUSTER
Corriendo con nodemon en modo cluster en puerto especificado:
nodemon server.js -m CLUSTER -p 8090
Corriendo con forever en modo fork default y puerto default:
forever start server.js --watch
Corriendo con forever en modo fork y puerto especificado:
forever start server.js -p 8090 --watch
Corriendo con forever en modo cluster y puerto default:
forever start server.js -m cluster --watch
Corriendo con forever en modo cluster y puerto especificado:
forever start server.js -m cluster -p 8090 --watch
Detener procesos forever:
forever stopall
Corriendo con pm2 en modo fork default con puerto default:
pm2 start server.js --watch
Corriendo con pm2 en modo fork default con puerto por argumentos:
pm2 start server.js --watch -- 8090
Corriendo con pm2 en modo cluster con puerto default:
pm2 start server.js --watch -i max
Cirriendo con pm2 en modo cluester con puerto por argumentos:
pm2 start server.js --watch -i max -- 8090
Eliminar procesos pm2:
pm2 delete all