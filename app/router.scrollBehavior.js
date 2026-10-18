/**
 * https://nuxtjs.org/docs/configuration-glossary/configuration-router/#scrollbehavior
 */
export default function (to, _from, savedPosition) {
  // the home page scrolls back to the last opened event itself (pages/index.vue)
  if (to.path === '/') return false
  if (savedPosition) return savedPosition
  // e.g. venue buttons link to #agenda, past the header (components/CollectionsBar.vue)
  if (to.hash) return { selector: to.hash }
  return { x: 0, y: 0 }
}
