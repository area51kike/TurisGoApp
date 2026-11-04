<template>
  <div class="q-pa-md text-center">
    <q-avatar size="90px" class="q-mb-md shadow-2">
      <q-spinner v-if="uploading" color="primary" size="40px" />
      <img
        v-else
        :src="userProfile.avatar || 'https://cdn.quasar.dev/img/avatar.png'"
        alt="Avatar"
      />
    </q-avatar>
    <div class="text-h6 text-weight-bold">{{ userProfile.name }}</div>
    <div class="text-caption text-grey q-mb-lg">Mago Kike - Turista Premium</div>

    <div class="q-gutter-y-sm text-left">
      <q-input
        outlined
        dense
        v-model="userName"
        :label="isEnglish ? 'Edit Name' : 'Editar Nombre'"
      />

      <q-file
        outlined
        dense
        v-model="imageFile"
        :label="isEnglish ? 'Select Avatar Image' : 'Seleccionar Imagen de Perfil'"
        accept="image/*"
        clearable
        @update:model-value="convertImageToBase64"
      >
        <template #prepend>
          <q-icon name="image" />
        </template>
      </q-file>

      <q-btn
        color="primary"
        class="full-width q-mt-md"
        :label="isEnglish ? 'Save Changes' : 'Guardar Cambios'"
        :loading="uploading"
        @click="$emit('save-profile')"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'PerfilSection',
  props: {
    isEnglish: Boolean,
    userProfile: Object,
  },
  emits: ['update:userProfile', 'save-profile'],
  setup(props, { emit }) {
    const imageFile = ref(null)
    const uploading = ref(false)

    const userName = computed({
      get: () => props.userProfile.name,
      set: (val) => {
        emit('update:userProfile', { ...props.userProfile, name: val })
      },
    })

    const convertImageToBase64 = (file) => {
      if (!file) return

      if (file.size > 500 * 1024) {
        alert(
          props.isEnglish
            ? 'Image is too large. Choose one under 500KB.'
            : 'La imagen es muy pesada. Elige una menor a 500KB.',
        )
        imageFile.value = null
        return
      }

      uploading.value = true
      const reader = new FileReader()

      reader.readAsDataURL(file)
      reader.onload = () => {
        emit('update:userProfile', { ...props.userProfile, avatar: reader.result })
        uploading.value = false
      }

      reader.onerror = () => {
        uploading.value = false
      }
    }

    return {
      userName,
      imageFile,
      uploading,
      convertImageToBase64,
    }
  },
}
</script>
