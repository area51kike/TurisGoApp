<template>
  <div class="q-pa-md">
    <div class="text-h6 text-weight-bold q-mb-xs">
      {{ isEnglish ? 'Travel Budget Calculator' : 'Calculadora de Presupuesto' }}
    </div>
    <p class="text-caption text-grey q-mb-md">
      {{ isEnglish ? 'Plan your trip expenses' : 'Planifica tus gastos de viaje' }}
    </p>

    <q-card class="q-pa-md q-mb-md bg-primary text-white text-center">
      <div class="text-caption">
        {{ isEnglish ? 'Total Estimated' : 'Total Estimado' }}
      </div>
      <div class="text-h4 text-weight-bold">${{ totalBudget }} USD</div>
    </q-card>

    <div class="q-gutter-y-sm">
      <q-input
        outlined
        dense
        type="number"
        v-model.number="transportCost"
        :label="isEnglish ? 'Transport / Gas ($)' : 'Transporte / Gasolina ($)'"
      />
      <q-input
        outlined
        dense
        type="number"
        v-model.number="foodCost"
        :label="isEnglish ? 'Food & Drinks ($)' : 'Alimentación ($)'"
      />
      <q-input
        outlined
        dense
        type="number"
        v-model.number="lodgingCost"
        :label="isEnglish ? 'Hotel / Lodging ($)' : 'Hospedaje ($)'"
      />
      <q-input
        outlined
        dense
        type="number"
        v-model.number="extrasCost"
        :label="isEnglish ? 'Activities & Extras ($)' : 'Entradas y Extras ($)'"
      />
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'PresupuestoSection',
  props: {
    isEnglish: Boolean,
    budgetCosts: Object,
    totalBudget: Number,
  },
  emits: ['update:budgetCosts'],
  setup(props, { emit }) {
    const updateCost = (key, val) => {
      emit('update:budgetCosts', { ...props.budgetCosts, [key]: val })
    }

    const transportCost = computed({
      get: () => props.budgetCosts.transport,
      set: (val) => updateCost('transport', val),
    })

    const foodCost = computed({
      get: () => props.budgetCosts.food,
      set: (val) => updateCost('food', val),
    })

    const lodgingCost = computed({
      get: () => props.budgetCosts.lodging,
      set: (val) => updateCost('lodging', val),
    })

    const extrasCost = computed({
      get: () => props.budgetCosts.extras,
      set: (val) => updateCost('extras', val),
    })

    return {
      transportCost,
      foodCost,
      lodgingCost,
      extrasCost,
    }
  },
}
</script>
