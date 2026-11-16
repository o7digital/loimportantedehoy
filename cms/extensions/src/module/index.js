import { defineModule } from '@directus/extensions-sdk';
import Studio from './studio.vue';
export default defineModule({ id: 'revista-studio', name: 'Studio de publicación', icon: 'auto_stories', routes: [{ path: '', component: Studio }] });
