# Novadash - Documentación de Arquitectura

## Índice
- [Visión General](#visión-general)
- [Arquitectura Actual](#arquitectura-actual)
- [Patrones de Diseño](#patrones-de-diseño)
- [Estructura de Capas](#estructura-de-capas)
- [Mejoras Recomendadas](#mejoras-recomendadas)
- [Guías de Implementación](#guías-de-implementación)
- [Estándares de Código](#estándares-de-código)

---

## Visión General

**Novadash** es un dashboard web para monitorear Bitcoin Core en tiempo real. Utiliza Node.js, Express y la librería `bitcoin-core` para comunicarse con un nodo Bitcoin vía RPC.

### Stack Tecnológico
- **Runtime**: Node.js (ES Modules)
- **Framework Web**: Express 5.x
- **Template Engine**: EJS
- **Bitcoin RPC**: bitcoin-core
- **Configuración**: dotenv
- **Testing**: Node.js native test runner

### Arquitectura Base
```
Cliente Web (Browser)
    ↓
Controller Layer (HTTP/Request Handling)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access)
    ↓
Bitcoin Core RPC
```

---

## Arquitectura Actual

### Estructura de Directorios
```
novadash/
├── controllers/          # Controladores HTTP (Request/Response)
│   └── dashboardController.js
├── services/            # Lógica de negocio
│   └── dashboardService.js
├── repositories/        # Acceso a datos (Bitcoin RPC)
│   └── bitcoinRepository.js
├── routes/             # Definición de rutas Express
│   └── index.js
├── views/              # Templates EJS
├── public/             # Assets estáticos (CSS, JS)
├── tests/              # Tests
├── index.js            # Punto de entrada y bootstrap
├── .env                # Variables de entorno
└── package.json
```

### Flujo de Datos

#### 1. **Capa de Repository** (`repositories/bitcoinRepository.js`)
- **Responsabilidad**: Comunicación directa con Bitcoin Core vía RPC
- **Patrón**: Repository Pattern
- **Dependencias**: `bitcoin-core`

```javascript
class BitcoinRepository {
    constructor(config) {
        this.client = new BitcoinCore(config);
    }
    
    async getBlockchainInfo() { /* ... */ }
    async getBlock(hash, verbosity) { /* ... */ }
    // ... más métodos RPC
}
```

**Características**:
- Abstrae la librería `bitcoin-core`
- Métodos 1:1 con llamadas RPC
- Sin lógica de negocio
- Fácil de mockear en tests

#### 2. **Capa de Service** (`services/dashboardService.js`)
- **Responsabilidad**: Lógica de negocio y orquestación
- **Patrón**: Service Layer Pattern
- **Dependencias**: BitcoinRepository

```javascript
class DashboardService {
    constructor(bitcoinRepository) {
        this.bitcoinRepository = bitcoinRepository;
    }
    
    async getDashboardData(numItemsToFetch = 20) {
        // Orquesta múltiples llamadas al repository
        // Transforma y procesa datos
        // Retorna datos estructurados
    }
}
```

**Características**:
- Combina datos de múltiples fuentes
- Calcula fee rates del mempool
- Obtiene bloques recientes en paralelo
- Transforma datos para la vista

#### 3. **Capa de Controller** (`controllers/dashboardController.js`)
- **Responsabilidad**: Manejo de HTTP requests/responses
- **Patrón**: Controller Pattern (MVC)
- **Dependencias**: DashboardService

```javascript
class DashboardController {
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    
    async showDashboard(req, res) {
        // Maneja request HTTP
        // Llama al service
        // Renderiza vista o envía JSON
        // Maneja errores HTTP
    }
}
```

**Características**:
- Maneja requests GET/POST
- Extrae parámetros de req.body
- Renderiza templates EJS
- Manejo de errores con try-catch
- Respuestas JSON para API

#### 4. **Capa de Routes** (`routes/index.js`)
- **Responsabilidad**: Definición de endpoints
- **Patrón**: Router Pattern

```javascript
export const createRoutes = (dashboardController) => {
    const router = express.Router();
    
    router.get('/', (req, res) => dashboardController.showDashboard(req, res));
    router.post('/lookup-block', (req, res) => dashboardController.lookupBlock(req, res));
    router.post('/lookup-tx', (req, res) => dashboardController.lookupTx(req, res));
    router.get('/api/update', (req, res) => dashboardController.getApiUpdate(req, res));
    
    return router;
};
```

#### 5. **Bootstrap** (`index.js`)
- **Responsabilidad**: Inicialización y configuración
- **Patrón**: Dependency Injection (manual)

```javascript
// Configuración
dotenv.config();
const app = express();

// Inyección de dependencias manual
const bitcoinRepository = new BitcoinRepository(bitcoinConfig);
const dashboardService = new DashboardService(bitcoinRepository);
const dashboardController = new DashboardController(dashboardService);

// Registro de rutas
app.use('/', createRoutes(dashboardController));

// Inicio del servidor
app.listen(port);
```

---

## Patrones de Diseño

### 1. **Layered Architecture (Arquitectura en Capas)**
Separación clara de responsabilidades en capas horizontales:
- **Presentation Layer**: Controllers + Routes
- **Business Logic Layer**: Services
- **Data Access Layer**: Repositories

**Beneficios**:
- Separación de responsabilidades
- Testeable (cada capa se mockea fácilmente)
- Mantenible y escalable

### 2. **Dependency Injection (DI)**
Actualmente implementado de forma manual en `index.js`:

```javascript
const bitcoinRepository = new BitcoinRepository(config);
const dashboardService = new DashboardService(bitcoinRepository);
const dashboardController = new DashboardController(dashboardService);
```

**Beneficios**:
- Bajo acoplamiento
- Fácil testing (inyectar mocks)
- Flexibilidad para cambiar implementaciones

### 3. **Repository Pattern**
Abstracción del acceso a datos (Bitcoin RPC):

**Beneficios**:
- Abstrae la fuente de datos
- Facilita cambiar de bitcoin-core a otra librería
- Centraliza lógica de acceso a datos

### 4. **Service Layer Pattern**
Lógica de negocio centralizada:

**Beneficios**:
- Controllers delgados (thin controllers)
- Lógica reutilizable
- Separación entre HTTP y lógica de negocio

---

## Estructura de Capas

### Responsabilidades por Capa

| Capa | Responsabilidad | NO debe hacer |
|------|----------------|---------------|
| **Controller** | - Validar entrada HTTP<br>- Extraer params/body<br>- Llamar service<br>- Formatear respuesta HTTP | - Lógica de negocio<br>- Acceso directo a datos<br>- Cálculos complejos |
| **Service** | - Lógica de negocio<br>- Orquestación de repositorios<br>- Transformación de datos<br>- Validación de reglas de negocio | - Conocer sobre HTTP<br>- Acceso directo a DB/RPC<br>- Renderizar vistas |
| **Repository** | - Llamadas a APIs externas<br>- Queries a DB<br>- Mapeo de datos externos | - Lógica de negocio<br>- Conocer sobre HTTP<br>- Transformaciones complejas |

### Flujo de Ejemplo: Buscar un Bloque

```
1. Usuario envía POST /lookup-block con { blockhash: "abc123" }
   ↓
2. Router llama a dashboardController.lookupBlock(req, res)
   ↓
3. Controller extrae blockhash de req.body
   ↓
4. Controller llama a dashboardService.getBlock(blockhash)
   ↓
5. Service llama a bitcoinRepository.getBlock(hash, 2)
   ↓
6. Repository llama a bitcoinCore.getBlock(hash, 2)
   ↓
7. Bitcoin Core retorna datos del bloque
   ↓
8. Repository retorna datos sin transformar
   ↓
9. Service retorna datos (puede transformar si es necesario)
   ↓
10. Controller renderiza vista EJS con los datos
   ↓
11. Usuario recibe HTML renderizado
```

---

## Mejoras Recomendadas

### 🔴 **PRIORIDAD ALTA**

#### 1. **Contenedor de Inyección de Dependencias**

**Problema actual**: 
- DI manual en `index.js` se vuelve complejo al crecer
- Difícil agregar nuevas dependencias
- No hay scopes (singleton, transient, etc.)

**Solución propuesta**:
```
Opción 1: Implementar DI Container simple (sin librerías)
Opción 2: Usar librería como 'awilix' (recomendado)
```

**Estructura propuesta**:
```javascript
// config/container.js
import { createContainer, asClass, asValue } from 'awilix';

export function buildContainer(config) {
    const container = createContainer();
    
    container.register({
        // Config
        bitcoinConfig: asValue(config.bitcoin),
        
        // Repositories
        bitcoinRepository: asClass(BitcoinRepository).singleton(),
        
        // Services
        dashboardService: asClass(DashboardService).singleton(),
        
        // Controllers
        dashboardController: asClass(DashboardController).singleton(),
    });
    
    return container;
}

// index.js
const container = buildContainer(config);
const dashboardController = container.resolve('dashboardController');
```

**Beneficios**:
- Configuración centralizada
- Auto-resolución de dependencias
- Lifecycle management (singleton, scoped)
- Mejor para testing

#### 2. **Middleware de Manejo de Errores Centralizado**

**Problema actual**:
- Try-catch duplicado en cada método del controller
- Mensajes de error inconsistentes
- Difícil logging centralizado

**Solución propuesta**:
```javascript
// middleware/errorHandler.js
export class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
    }
}

export class BitcoinConnectionError extends AppError {
    constructor(message) {
        super(message, 503);
    }
}

export class BlockNotFoundError extends AppError {
    constructor(blockhash) {
        super(`Block "${blockhash}" not found`, 404);
    }
}

export function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Internal Server Error';
    
    logger.error('Error:', { err, url: req.url });
    
    if (req.accepts('html')) {
        res.status(statusCode).render('index', {
            error: message,
            blockchainInfo: null,
            // ... datos vacíos
        });
    } else {
        res.status(statusCode).json({ error: message });
    }
}

// index.js
app.use(errorHandler);
```

**Uso en Controllers**:
```javascript
async lookupBlock(req, res, next) {
    try {
        const { blockhash } = req.body;
        const blockDetails = await this.dashboardService.getBlock(blockhash);
        const data = await this.dashboardService.getDashboardData();
        res.render('index', { ...data, blockDetails, txDetails: null, error: null });
    } catch (error) {
        next(error); // El errorHandler se encarga
    }
}
```

#### 3. **Validación de Entrada con Middleware**

**Problema actual**:
- No valida formato de blockhash/txid
- Permite inputs maliciosos
- Validación inconsistente

**Solución propuesta**:
```javascript
// middleware/validation.js
import Joi from 'joi';

export const schemas = {
    blockhash: Joi.string().hex().length(64).required(),
    txid: Joi.string().hex().length(64).required(),
};

export function validate(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body);
        if (error) {
            return next(new ValidationError(error.details[0].message));
        }
        req.validatedBody = value;
        next();
    };
}

// routes/index.js
router.post('/lookup-block', 
    validate(Joi.object({ blockhash: schemas.blockhash })),
    (req, res, next) => dashboardController.lookupBlock(req, res, next)
);
```

**Alternativa sin librería**:
```javascript
export function validateBlockhash(req, res, next) {
    const { blockhash } = req.body;
    if (!blockhash || !/^[0-9a-f]{64}$/i.test(blockhash)) {
        return next(new ValidationError('Invalid blockhash format'));
    }
    next();
}
```

#### 4. **Configuración Centralizada y Validada**

**Problema actual**:
- Variables de entorno dispersas
- Validación básica
- No hay configuración por ambiente

**Solución propuesta**:
```javascript
// config/index.js
import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3000),
    RPC_HOST: Joi.string().default('127.0.0.1'),
    RPC_PORT: Joi.number().default(8332),
    RPC_USER: Joi.string().required(),
    RPC_PASSWORD: Joi.string().required(),
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
}).unknown();

const { error, value: env } = envSchema.validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
    env: env.NODE_ENV,
    port: env.PORT,
    bitcoin: {
        host: env.RPC_HOST,
        port: env.RPC_PORT,
        username: env.RPC_USER,
        password: env.RPC_PASSWORD,
    },
    logging: {
        level: env.LOG_LEVEL,
    },
};

// index.js
import { config } from './config/index.js';

const bitcoinRepository = new BitcoinRepository(config.bitcoin);
app.listen(config.port);
```

### 🟡 **PRIORIDAD MEDIA**

#### 5. **Sistema de Logging Estructurado**

**Problema actual**:
- `console.log` y `console.error` básicos
- No hay niveles de log
- Difícil filtrar y analizar logs

**Solución propuesta (Winston)**:
```javascript
// utils/logger.js
import winston from 'winston';
import { config } from '../config/index.js';

const logger = winston.createLogger({
    level: config.logging.level,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

if (config.env !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

export default logger;

// Uso
import logger from './utils/logger.js';

logger.info('Dashboard loaded', { blocks: latestBlocks.length });
logger.error('Bitcoin connection failed', { error: err.message });
logger.debug('Mempool data', { txCount: mempool.length });
```

#### 6. **DTOs (Data Transfer Objects)**

**Problema actual**:
- Datos internos expuestos directamente
- No hay transformación consistente
- Difícil cambiar estructura de respuesta

**Solución propuesta**:
```javascript
// dtos/blockDto.js
export class BlockDto {
    constructor(blockData) {
        this.height = blockData.height;
        this.hash = blockData.hash;
        this.timestamp = blockData.time;
        this.transactionCount = blockData.nTx;
        this.size = blockData.size;
    }
    
    static fromArray(blocks) {
        return blocks.map(block => new BlockDto(block));
    }
}

// services/dashboardService.js
async getDashboardData() {
    const blocks = await this.fetchLatestBlocks();
    return {
        latestBlocks: BlockDto.fromArray(blocks),
        // ...
    };
}
```

#### 7. **Capa de Caché**

**Problema actual**:
- Cada request golpea Bitcoin Core
- Bloques antiguos son inmutables pero se re-fetch
- Impacto en performance

**Solución propuesta**:
```javascript
// services/cacheService.js
export class CacheService {
    constructor(ttlSeconds = 300) {
        this.cache = new Map();
        this.ttl = ttlSeconds * 1000;
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    set(key, value, customTtl = null) {
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + (customTtl || this.ttl),
        });
    }
}

// services/dashboardService.js
constructor(bitcoinRepository, cacheService) {
    this.bitcoinRepository = bitcoinRepository;
    this.cache = cacheService;
}

async getBlock(hash) {
    const cached = this.cache.get(`block:${hash}`);
    if (cached) return cached;
    
    const block = await this.bitcoinRepository.getBlock(hash, 2);
    
    // Bloques confirmados son inmutables, TTL largo
    this.cache.set(`block:${hash}`, block, 86400000); // 24h
    
    return block;
}
```

**Alternativa Redis** (para producción):
```javascript
import Redis from 'ioredis';

export class RedisCacheService {
    constructor(redisUrl) {
        this.redis = new Redis(redisUrl);
    }
    
    async get(key) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
    }
    
    async set(key, value, ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    }
}
```

### 🟢 **PRIORIDAD BAJA (Futuro)**

#### 8. **Testing Completo**

**Estructura propuesta**:
```
tests/
├── unit/
│   ├── services/
│   │   └── dashboardService.test.js
│   └── repositories/
│       └── bitcoinRepository.test.js
├── integration/
│   └── controllers/
│       └── dashboardController.test.js
└── e2e/
    └── dashboard.test.js
```

**Ejemplo test unitario**:
```javascript
// tests/unit/services/dashboardService.test.js
import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { DashboardService } from '../../../services/dashboardService.js';

describe('DashboardService', () => {
    it('should fetch dashboard data', async () => {
        const mockRepository = {
            getBlockchainInfo: mock.fn(async () => ({ blocks: 100 })),
            getNetworkInfo: mock.fn(async () => ({ version: 270000 })),
            getMempoolInfo: mock.fn(async () => ({ size: 50 })),
            getRawMempool: mock.fn(async () => ({})),
            getBlockHash: mock.fn(async () => 'abc123'),
            getBlockHeader: mock.fn(async () => ({ height: 100, hash: 'abc123' })),
        };
        
        const service = new DashboardService(mockRepository);
        const data = await service.getDashboardData(5);
        
        assert.ok(data.blockchainInfo);
        assert.strictEqual(data.blockchainInfo.blocks, 100);
        assert.strictEqual(mockRepository.getBlockchainInfo.mock.calls.length, 1);
    });
});
```

#### 9. **Rate Limiting**

Para proteger el servidor y Bitcoin Core:

```javascript
// middleware/rateLimit.js
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 30, // 30 requests por minuto
    message: 'Too many requests, please try again later',
});

// index.js
app.use('/api/', apiLimiter);
```

#### 10. **Healthcheck Endpoint**

```javascript
// routes/index.js
router.get('/health', async (req, res) => {
    try {
        await bitcoinRepository.getBlockchainInfo();
        res.json({ status: 'healthy', bitcoin: 'connected' });
    } catch (error) {
        res.status(503).json({ status: 'unhealthy', bitcoin: 'disconnected' });
    }
});
```

---

## Guías de Implementación

### Añadir Nueva Funcionalidad

**Ejemplo**: Agregar búsqueda de dirección Bitcoin

#### 1. **Repository Layer**
```javascript
// repositories/bitcoinRepository.js
async getAddressInfo(address) {
    return this.client.getAddressInfo(address);
}
```

#### 2. **Service Layer**
```javascript
// services/dashboardService.js
async getAddress(address) {
    const info = await this.bitcoinRepository.getAddressInfo(address);
    // Transformar o enriquecer datos si es necesario
    return info;
}
```

#### 3. **Controller Layer**
```javascript
// controllers/dashboardController.js
async lookupAddress(req, res, next) {
    try {
        const { address } = req.validatedBody;
        const addressInfo = await this.dashboardService.getAddress(address);
        const data = await this.dashboardService.getDashboardData();
        res.render('index', { ...data, addressInfo, error: null });
    } catch (error) {
        next(error);
    }
}
```

#### 4. **Routes**
```javascript
// routes/index.js
router.post('/lookup-address',
    validate(Joi.object({ address: Joi.string().required() })),
    (req, res, next) => dashboardController.lookupAddress(req, res, next)
);
```

#### 5. **Tests**
```javascript
// tests/unit/services/dashboardService.test.js
it('should get address info', async () => {
    const mockRepo = { getAddressInfo: mock.fn(async () => ({ address: 'bc1...' })) };
    const service = new DashboardService(mockRepo);
    const info = await service.getAddress('bc1...');
    assert.ok(info.address);
});
```

### Mejores Prácticas

#### **1. Controllers**
```javascript
// ✅ BIEN
async lookupBlock(req, res, next) {
    try {
        const { blockhash } = req.validatedBody;
        const data = await this.dashboardService.getBlockWithContext(blockhash);
        res.render('index', data);
    } catch (error) {
        next(error);
    }
}

// ❌ MAL (demasiada lógica)
async lookupBlock(req, res) {
    const { blockhash } = req.body;
    if (!blockhash || blockhash.length !== 64) {
        return res.status(400).send('Invalid hash');
    }
    
    const block = await bitcoinRepository.getBlock(blockhash);
    const info = await bitcoinRepository.getBlockchainInfo();
    const mempool = await bitcoinRepository.getMempoolInfo();
    
    // ... mucha lógica de transformación
    
    res.render('index', { /* ... */ });
}
```

#### **2. Services**
```javascript
// ✅ BIEN (métodos pequeños y enfocados)
async getDashboardData() {
    const [blockchain, network, mempool] = await Promise.all([
        this.getBlockchainData(),
        this.getNetworkData(),
        this.getMempoolData(),
    ]);
    
    return { blockchain, network, mempool };
}

async getBlockchainData() {
    const info = await this.bitcoinRepository.getBlockchainInfo();
    const blocks = await this.fetchLatestBlocks(info.blocks);
    return { info, blocks };
}

// ❌ MAL (método gigante)
async getDashboardData() {
    // 200 líneas de código mezclando todo
}
```

#### **3. Error Handling**
```javascript
// ✅ BIEN
throw new BlockNotFoundError(blockhash);

// ❌ MAL
throw new Error(`Block ${blockhash} not found`);
```

#### **4. Naming Conventions**
```javascript
// ✅ BIEN
class DashboardService { }
async getDashboardData() { }
const blockchainInfo = await ...;

// ❌ MAL
class dashboard_service { }
async get_data() { }
const data = await ...;
```

---

## Estándares de Código

### Convenciones de Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Clases | PascalCase | `DashboardService`, `BitcoinRepository` |
| Métodos/Funciones | camelCase | `getDashboardData()`, `lookupBlock()` |
| Variables/Constantes | camelCase | `blockchainInfo`, `latestBlocks` |
| Archivos | camelCase | `dashboardService.js`, `bitcoinRepository.js` |
| Constantes globales | UPPER_SNAKE_CASE | `DEFAULT_BLOCK_COUNT`, `MAX_RETRIES` |

### Estructura de Archivos

```javascript
// 1. Imports (externos primero, internos después)
import express from 'express';
import { DashboardService } from './services/dashboardService.js';

// 2. Constantes
const DEFAULT_ITEMS = 20;

// 3. Clase o funciones principales
export class DashboardController {
    // ...
}

// 4. Exports adicionales si los hay
export { helperFunction };
```

### Manejo de Async/Await

```javascript
// ✅ BIEN
async function getData() {
    const [blocks, mempool] = await Promise.all([
        getBlocks(),
        getMempool(),
    ]);
    return { blocks, mempool };
}

// ❌ MAL (secuencial innecesario)
async function getData() {
    const blocks = await getBlocks();
    const mempool = await getMempool();
    return { blocks, mempool };
}
```

### Comentarios

```javascript
// ✅ BIEN (solo cuando aporta valor)
// Calculate fee rate in sat/vB
const feeRate = (details.fees.base * 100000000) / details.vsize;

// ❌ MAL (obvio)
// Get blockchain info
const info = await getBlockchainInfo();
```

---

## Estructura Propuesta Final

Con todas las mejoras implementadas:

```
novadash/
├── config/
│   ├── index.js              # Configuración centralizada
│   └── container.js          # DI Container
├── controllers/
│   └── dashboardController.js
├── services/
│   ├── dashboardService.js
│   └── cacheService.js       # [NUEVO]
├── repositories/
│   └── bitcoinRepository.js
├── routes/
│   ├── index.js
│   └── health.js             # [NUEVO]
├── middleware/
│   ├── errorHandler.js       # [NUEVO]
│   ├── validation.js         # [NUEVO]
│   └── rateLimit.js          # [NUEVO]
├── dtos/
│   ├── blockDto.js           # [NUEVO]
│   └── transactionDto.js     # [NUEVO]
├── utils/
│   ├── logger.js             # [NUEVO]
│   └── errors.js             # [NUEVO]
├── views/
├── public/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── logs/                      # [NUEVO]
├── index.js
├── .env
└── package.json
```

---

## Roadmap de Implementación

### Fase 1: Fundamentos (1-2 días)
- [ ] Configuración centralizada (`config/index.js`)
- [ ] Middleware de errores (`middleware/errorHandler.js`)
- [ ] Clases de error custom (`utils/errors.js`)
- [ ] Logger básico (`utils/logger.js`)

### Fase 2: Validación y Seguridad (1 día)
- [ ] Middleware de validación (`middleware/validation.js`)
- [ ] Rate limiting
- [ ] Healthcheck endpoint

### Fase 3: DI y Caché (1-2 días)
- [ ] Contenedor DI (`config/container.js`)
- [ ] Cache service (in-memory)
- [ ] Refactor de dependencias

### Fase 4: Testing (2-3 días)
- [ ] Tests unitarios de services
- [ ] Tests unitarios de repositories
- [ ] Tests de integración de controllers
- [ ] CI/CD setup

### Fase 5: Optimizaciones (1-2 días)
- [ ] DTOs
- [ ] Redis cache (opcional)
- [ ] Monitoring y métricas

---

## Recursos y Referencias

### Librerías Recomendadas

| Propósito | Librería | Alternativa |
|-----------|----------|-------------|
| Validación | `joi` | `zod`, `yup` |
| DI Container | `awilix` | Implementación manual |
| Logging | `winston` | `pino` |
| Testing | Node.js native | `jest`, `vitest` |
| Cache | `node-cache` | `redis` (producción) |
| Rate Limit | `express-rate-limit` | - |

### Patrones de Arquitectura
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Layered Architecture](https://www.oreilly.com/library/view/software-architecture-patterns/9781491971437/ch01.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Dependency Injection](https://martinfowler.com/articles/injection.html)

### Node.js Best Practices
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

---

## Notas para Desarrolladores AI

### Cuando te pidan modificar el código:

1. **Revisar esta documentación primero** para entender la arquitectura
2. **Respetar la separación de capas**: no mezclar responsabilidades
3. **Seguir los patrones existentes**: no inventar nuevos sin justificación
4. **Añadir tests** para funcionalidad nueva
5. **Actualizar este documento** si cambias patrones arquitectónicos

### Reglas de oro:

- ✅ Controllers delgados → toda la lógica en Services
- ✅ Repositories solo acceso a datos → sin lógica de negocio
- ✅ Inyectar dependencias → no instanciar dentro de clases
- ✅ Manejar errores con middleware → no try-catch en todos lados
- ✅ Validar entrada → nunca confiar en datos del cliente
- ✅ Usar async/await → evitar callbacks
- ✅ Promise.all para paralelismo → cuando sea posible

### Preguntas comunes:

**¿Dónde pongo lógica de cálculo de fee rates?**  
→ Service layer (`dashboardService.js`)

**¿Dónde valido el formato de un blockhash?**  
→ Middleware de validación antes del controller

**¿Dónde cacheo bloques?**  
→ Service layer usando `cacheService`

**¿Dónde manejo errores de conexión a Bitcoin Core?**  
→ Repository lanza error → Service lo propaga → Middleware lo maneja

**¿Dónde transformo datos para la vista?**  
→ DTOs o Service layer, nunca en Controller

---

## Changelog de Arquitectura

### v1.0.0 (Actual)
- ✅ Arquitectura en 3 capas (Repository, Service, Controller)
- ✅ Dependency Injection manual
- ✅ Separación de routes
- ✅ Manejo básico de errores

### v2.0.0 (Propuesto)
- [ ] DI Container automático
- [ ] Middleware de errores centralizado
- [ ] Validación con middleware
- [ ] Sistema de logging estructurado
- [ ] Caché implementado
- [ ] DTOs para transformación de datos
- [ ] Tests completos

---

**Última actualización**: 2026-02-07  
**Versión del documento**: 1.0.0  
**Mantenedor**: Equipo Novadash
