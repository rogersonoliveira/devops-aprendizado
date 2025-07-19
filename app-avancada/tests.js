#!/usr/bin/env node

/**
 * Testes Automatizados para DevOps App Avançada
 * Rogerson Oliveira - Pipeline CI/CD
 */

const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');

// Configurações de teste
const TEST_CONFIG = {
    host: process.env.TEST_HOST || 'localhost',
    port: process.env.TEST_PORT || 80,
    timeout: 10000
};

// Cores para output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    log(message, color = colors.reset) {
        console.log(`${color}${message}${colors.reset}`);
    }

    async runTest(testName, testFunction) {
        this.results.total++;
        process.stdout.write(`${colors.blue}[RUNNING]${colors.reset} ${testName}... `);
        
        try {
            await testFunction();
            this.results.passed++;
            console.log(`${colors.green}✅ PASSED${colors.reset}`);
        } catch (error) {
            this.results.failed++;
            console.log(`${colors.red}❌ FAILED${colors.reset}`);
            console.log(`${colors.red}  Error: ${error.message}${colors.reset}`);
        }
    }

    async makeRequest(path = '/', expectedStatus = 200) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: TEST_CONFIG.host,
                port: TEST_CONFIG.port,
                path: path,
                method: 'GET',
                timeout: TEST_CONFIG.timeout
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === expectedStatus) {
                        resolve({ statusCode: res.statusCode, data, headers: res.headers });
                    } else {
                        reject(new Error(`Expected status ${expectedStatus}, got ${res.statusCode}`));
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    async runAllTests() {
        this.log(`\n${colors.bold}🧪 INICIANDO TESTES AUTOMATIZADOS${colors.reset}`);
        this.log(`${colors.blue}Target: http://${TEST_CONFIG.host}:${TEST_CONFIG.port}${colors.reset}\n`);

        // 1. Teste de conectividade básica
        await this.runTest('Conectividade da aplicação', async () => {
            const response = await this.makeRequest('/');
            if (!response.data.includes('DevOps App Avançada')) {
                throw new Error('Conteúdo da página não encontrado');
            }
        });

        // 2. Teste do Health Check
        await this.runTest('Health Check endpoint', async () => {
            const response = await this.makeRequest('/health');
            if (!response.data.includes('HEALTHY') && !response.data.includes('Health Check')) {
                throw new Error('Health check não retornou status saudável');
            }
        });

        // 3. Teste de segurança - Headers
        await this.runTest('Headers de segurança', async () => {
            const response = await this.makeRequest('/');
            const requiredHeaders = [
                'x-frame-options',
                'x-content-type-options',
                'x-xss-protection'
            ];
            
            for (const header of requiredHeaders) {
                if (!response.headers[header]) {
                    throw new Error(`Header de segurança ausente: ${header}`);
                }
            }
        });

        // 4. Teste de performance - Response time
        await this.runTest('Tempo de resposta', async () => {
            const start = Date.now();
            await this.makeRequest('/');
            const responseTime = Date.now() - start;
            
            if (responseTime > 5000) {
                throw new Error(`Tempo de resposta muito alto: ${responseTime}ms`);
            }
        });

        // 5. Teste de API endpoints
        await this.runTest('API endpoints', async () => {
            const response = await this.makeRequest('/api/status');
            const data = JSON.parse(response.data);
            
            if (data.status !== 'ok') {
                throw new Error('API não retornou status OK');
            }
        });

        // 6. Teste de métricas
        await this.runTest('Endpoint de métricas', async () => {
            const response = await this.makeRequest('/metrics');
            if (!response.data.includes('http_requests_total')) {
                throw new Error('Métricas não disponíveis');
            }
        });

        // 7. Teste de erro 404
        await this.runTest('Tratamento de erro 404', async () => {
            await this.makeRequest('/pagina-inexistente', 404);
        });

        // 8. Teste de conteúdo estático
        await this.runTest('Validação de conteúdo HTML', async () => {
            const response = await this.makeRequest('/');
            const requiredContent = [
                'Pipeline CI/CD',
                'Security Scan',
                'Testes Automatizados',
                'Monitoramento'
            ];
            
            for