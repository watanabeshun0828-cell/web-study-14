import { defineConfig, devices } from '@playwright/test'
import config from './src/data/config.json' with {type:'json'}
const base=process.env.VITE_BASE_PATH??'/'+config.appId+'/'
const url=process.env.E2E_BASE_URL??'http://127.0.0.1:'+config.port+base
export default defineConfig({testDir:'./tests',fullyParallel:false,workers:1,timeout:40000,expect:{timeout:8000},reporter:'list',use:{baseURL:url,trace:'retain-on-failure'},projects:[{name:'chromium-mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}],webServer:{env:{VITE_BASE_PATH:base},command:'npm run preview -- --port '+config.port+' --strictPort',url,reuseExistingServer:false,timeout:90000}})
