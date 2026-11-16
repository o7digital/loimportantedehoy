<script setup>
import { computed, ref, watch } from 'vue';
import Icon from './studio-icon.vue';
const props = defineProps({ image: String, label: String, note: String, transparent: Boolean, field: String });
const emit = defineEmits(['choose', 'clear']);
const failed = ref(false); watch(() => props.image, () => { failed.value = false; });
const url = computed(() => props.image ? `/assets/${encodeURIComponent(props.image)}?width=500&quality=85` : '');
</script>
<template><section class="ed-media" :data-editor-field="field"><div class="ed-media-label">{{ label }}</div><button type="button" class="ed-media-picture" :class="{ 'is-transparent': transparent }" @click="emit('choose')"><img v-if="image && !failed" :src="url" :alt="label" @error="failed = true" /><span v-else><Icon name="image" /><strong>{{ failed ? 'Imagen no disponible' : 'Una imagen para tu historia' }}</strong><small>Seleccionar de la biblioteca o subir una imagen</small></span><b><Icon name="pencil" />{{ image ? 'Cambiar imagen' : 'Elegir imagen' }}</b></button><div class="ed-media-caption"><p>{{ note }}</p><button v-if="image" type="button" @click="emit('clear')">Quitar</button></div></section></template>
