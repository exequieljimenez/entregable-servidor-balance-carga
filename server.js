import express, { json, urlencoded } from 'express';
import session from 'express-session';
import exphbs from 'express-handlebars';
import path, { join } from 'path';
import bcrypt from 'bcrypt'
import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy } from 'passport-local';
import mongoose from 'mongoose';
import * as model from './usuarios.js'
import minimist from 'minimist';
import Contenedor from './contenedores/ContenedorProductos.js';
import randomRouter from './routes/routeRandom.js';
import cluster from 'cluster';
import os from 'os'
const numCores = os.cpus().length

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const productosApi = new Contenedor('productos.json')

async function addUser(usuario) {
    try {
        const URL = `mongodb://${process.env.DB_MONGO_HOST}:${process.env.DB_MONGO_PORT}/usuariosEntregable11`;
        mongoose.connect(URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })

        const user = usuario

        const userSave = new model.users(user);
        const savedUser = await userSave.save();
    } catch (error) {
        console.log(error)
    }
}

async function readUser(usuario) {
    try {
        const URL = `mongodb://localhost:${process.env.DB_MONGO_PORT}/usuariosEntregable11`;
        mongoose.connect(URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        const userRead = await model.users.findOne({email: usuario})
        return userRead
    } catch (error) {
        
    }
}

const LocalStrategy = Strategy;

dotenv.config()

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}))

app.use('/api', randomRouter)

passport.use(new LocalStrategy(
    async function (username, password, done)
    {
        const existeUsuario = await readUser(username)
        if(!existeUsuario) {
            return done(null, false)
        } else {
            const match = await verifyPass(existeUsuario, password)

            if(!match) {
                return done(null, false)
            }
            return done(null, existeUsuario)
        }
    }
))

passport.serializeUser((usuario, done) => {
    done(null, usuario.email)
})

passport.deserializeUser(async (email, done) => {
    const existeUsuario = await readUser(email);
    done(null, existeUsuario)
})

app.set('views', 'src/views');
app.engine('.hbs', exphbs.engine({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    extname: '.hbs'
}));
app.set('view engine', '.hbs')

function isAuth(req, res, next) {
    if(req.isAuthenticated()) {
        next()
    } else {
        res.redirect('/login')
    }
}

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 600000
    }
}))

app.use(passport.initialize());
app.use(passport.session())

async function generateHashPassword(password) {
    const hashPassword = await bcrypt.hash(password, 10)
    return hashPassword
}

async function verifyPass(usuario, password) {
    const match = await bcrypt.compare(password, usuario.password)
    return match
}

app.get('/', (req, res) => {
    res.redirect('login')
})

app.get('/login', (req, res) => {
    res.render('login.hbs')
})

app.get('/register', (req, res) => {
    res.render('register.hbs')
})

app.post('/login', passport.authenticate('local', {successRedirect: '/datos', failureRedirect: '/login-error'}))

app.get('/datos', isAuth, async (req, res) => {
    const datosUsuario = {
        email: req.user.email
    }
    const products = await productosApi.getAll()
    res.render('datos', {datos: datosUsuario, products: products})
    

})

app.post('/datos', async(req, res) => {
    const nuevoProducto = req.body;
    const result = await productosApi.save(nuevoProducto);
    res.redirect('/datos')
})

app.post('/register', async (req, res) => {
    const {email, password} = req.body;
    const newUsuario = await readUser(email)
    if(newUsuario) {
        res.render('register-error')
    } else {
        const newUser = {email, password: await generateHashPassword(password)}
        addUser(newUser)
        res.redirect('/login')
    }
})

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if(err) {
            throw err
        }
        res.redirect('/login')
    })
})

app.get('/login-error', (req, res) => {
    res.render('login-error')
})

app.get('/info', (req, res) => {
    res.send(`<p>Argumentos de entrada: ${process.argv.slice(2)}</p><br><p>Sistema operativo: ${process.platform}</p><br><p>Versión de node: ${process.version}</p><br><p>Memoria total reservada: ${process.memoryUsage().rss}</p><br><p>Path de ejecucion: ${process.cwd()}</p><br><p>Process Id: ${process.pid}</p><br><p>Carpeta del proyecto: ${path.basename(__dirname)}</p><br><p>Número de procesadores presentes en el servidor: ${numCores}</p>`)
})

// let options = {alias: {p: 'port'}, default: {p: 8080}}
// let port = minimist(process.argv.slice(2), options)

const argOptions = {alias: {m: 'modo', p: 'port'}, default: {modo: 'FORK', port: 8080}};
const objArguments = minimist(process.argv.slice(2), argOptions);

const options = {
    server: {
        MODO:objArguments.modo,
        PORT:objArguments.port
    }
}

const PORT = options.server.PORT

if(options.server.MODO === "CLUSTER" && cluster.isPrimary) {
    for(let i = 0; i < numCores; i++) {
        cluster.fork();
    };
    cluster.on("exit", (worker) => {
        console.log(`Proceso ${worker.process.pid} dejó de funcionar`);
        cluster.fork();
    });
} else {
    const server = app.listen(PORT, () => {
        console.log(`Servidor escuchando en puerto ${JSON.stringify(PORT)} con el proceso ${process.pid}`);
    })
    server.on('error', error => {
        console.error(`Error en el servidor ${error}`);
    });
}

