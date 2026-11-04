import {defineConfig} from 'astro/config';
import wix from '@wix/astro';
import wixPages from '@wix/astro-pages';
import wixHostingAdapter from '@wix/astro-wix-hosting-adapter';
export default defineConfig({publicDir:'./backend-public',integrations:[wix(),wixPages()],security:{checkOrigin:false},adapter:wixHostingAdapter({configPath:'./wrangler.json'}),output:'server'});
