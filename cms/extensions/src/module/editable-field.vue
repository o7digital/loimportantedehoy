<script setup>
import { useId } from 'vue';
defineProps({ modelValue: { default: '' }, label: String, field: String, multiline: Boolean, rows: { default: 3 }, type: { default: 'text' }, note: String, placeholder: String, required: Boolean });
const emit = defineEmits(['update:modelValue']);
const id = useId();
</script>
<template><label class="ed-field" :for="id"><span>{{ label }}<small aria-hidden="true">Editable</small></span><textarea v-if="multiline" :id="id" :aria-label="label" :value="modelValue ?? ''" :rows="rows" :placeholder="placeholder" :required="required" :data-editor-field="field" @input="emit('update:modelValue', $event.target.value)" /><input v-else :id="id" :aria-label="label" :type="type" :value="modelValue ?? ''" :placeholder="placeholder" :required="required" :data-editor-field="field" @input="emit('update:modelValue', $event.target.value)" /><em v-if="note">{{ note }}</em></label></template>
