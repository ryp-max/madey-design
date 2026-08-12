const { loadProducts } = require('./_products-store');

module.exports = async (req, res) => {
  const products = await loadProducts();
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  return res.status(200).json(products);
};
