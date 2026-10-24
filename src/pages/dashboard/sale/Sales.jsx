import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Input,
  Select,
  Option,
  Spinner,
} from "@material-tailwind/react";
import { saleService } from "@/services/saleService";
import { productService } from "@/services/productService";
import { validateQuantity, validateRequired } from "@/utils/validators";

export function Sales() {
  const [products, setProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([{ productId: '', quantity: 1, unitPrice: 0 }]);
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsData, salesData] = await Promise.all([
        productService.getAll(),
        saleService.getRecent()
      ]);
      setProducts(productsData);
      setRecentSales(salesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // Si se selecciona un producto, obtener su precio automáticamente
    if (field === 'productId' && value) {
      const selectedProduct = products.find(p => p.productId === parseInt(value));
      if (selectedProduct) {
        newItems[index].unitPrice = selectedProduct.price || 0;
      }
    }
    
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const customerError = validateRequired(customerName, 'El nombre del cliente');
    if (customerError) {
      alert(customerError);
      return;
    }

    // Stock pedido por producto (el mismo producto puede repetirse en varias filas).
    const requested = {};
    for (let i = 0; i < items.length; i++) {
      if (!items[i].productId) {
        alert(`Por favor selecciona un producto para la fila ${i + 1}`);
        return;
      }
      const productId = parseInt(items[i].productId);
      const product = products.find((p) => p.productId === productId);
      if (!product || !product.active) {
        alert(`El producto de la fila ${i + 1} no está disponible para la venta`);
        return;
      }
      requested[productId] = (requested[productId] || 0) + Number(items[i].quantity);
      const quantityError = validateQuantity(items[i].quantity, product.stock - (requested[productId] - Number(items[i].quantity)));
      if (quantityError) {
        alert(`Fila ${i + 1} (${product.name}): ${quantityError}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // El precio y el total los calcula el servidor con el precio vigente del
      // producto; aquí solo se envían producto y cantidad.
      const saleData = {
        customerName: customerName.trim(),
        items: items.map(item => ({
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity)
        }))
      };

      await saleService.create(saleData);
      
      setItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
      setCustomerName('');
      await fetchData();
      alert('Venta registrada exitosamente');
    } catch (error) {
      console.error('Error creating sale:', error);
      const errorMsg = error.response?.data?.message || 
                       error.response?.data?.error || 
                       'Error al registrar la venta';
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="mt-12">
      <Typography variant="h5" color="blue-gray" className="mb-6">
        Registrar Venta
      </Typography>

      <Card className="p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              label="Nombre del cliente"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>

          <Typography variant="h6" color="blue-gray">
            Productos
          </Typography>

          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Select
                label="Producto"
                value={item.productId}
                onChange={(value) => updateItem(index, 'productId', value)}
              >
                {products.filter((p) => p.active).map((product) => (
                  <Option key={product.productId} value={product.productId.toString()}>
                    {product.name} (Stock: {product.stock})
                  </Option>
                ))}
              </Select>

              <Input
                label="Cantidad"
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
              />

              {/* El precio es el del catálogo: el servidor lo fija, no se edita aquí. */}
              <Input
                label="Precio Unitario (catálogo)"
                type="number"
                value={item.unitPrice}
                readOnly
                disabled
              />

              <div className="flex items-center gap-2">
                <Typography variant="small" color="blue-gray" className="font-medium">
                  Total: Q{(item.unitPrice * item.quantity).toFixed(2)}
                </Typography>
                {items.length > 1 && (
                  <Button
                    color="red"
                    variant="text"
                    size="sm"
                    onClick={() => removeItem(index)}
                  >
                    Eliminar
                  </Button>
                )}
              </div>
            </div>
          ))}

          <Button
            variant="outlined"
            color="blue-gray"
            onClick={addItem}
            className="w-full"
          >
            Agregar Producto
          </Button>

          <div className="flex justify-between items-center">
            <Typography variant="h6" color="blue-gray">
              Total de la Venta: Q{items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0).toFixed(2)}
            </Typography>
            <Button type="submit" color="green" disabled={submitting}>
              {submitting ? 'Registrando...' : 'Registrar Venta'}
            </Button>
          </div>
        </form>
      </Card>

      <Typography variant="h5" color="blue-gray" className="mb-4">
        Ventas Recientes
      </Typography>

      <Card className="p-6">
        {recentSales.length === 0 ? (
          <Typography color="gray">No hay ventas registradas</Typography>
        ) : (
          <div className="space-y-2">
            {recentSales.map((sale, index) => (
              <div key={index} className="flex items-center justify-between border-b py-2">
                <div>
                  <Typography variant="small" color="blue-gray">
                    {sale.customerName || 'Cliente Anónimo'}
                  </Typography>
                  <Typography variant="small" color="gray">
                    {new Date(sale.date).toLocaleString()}
                  </Typography>
                  <Typography variant="small" color="gray">
                    {sale.items?.length || 0} productos
                  </Typography>
                </div>
                <Typography variant="h6" color="blue-gray">
                  Q{sale.total?.toFixed(2) || '0.00'}
                </Typography>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}