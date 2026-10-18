<template>
<!-- the `collections` name keeps the cookie of earlier versions (collections_collapsed) -->
<CollapsibleSection name='collections' :label="$t('common.venues')">
  <div class='collections__list'>
    <v-btn small outlined v-for='collection in collections'
      color='primary' :key='collection.id'
      :to='`/collection/${encodeURIComponent(collection.name)}#agenda`'>{{ collection.name }}</v-btn>
  </div>
</CollapsibleSection>
</template>
<script>
import CollapsibleSection from '@/components/CollapsibleSection'

/** The collections (venues) bar of the home and collection pages */
export default {
  name: 'CollectionsBar',
  components: { CollapsibleSection },
  props: {
    collections: { type: Array, default: () => [] }
  }
}
</script>
<style>
.collections__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
