import React, { useState, useEffect, useRef } from 'react';
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
import { validateEmail, validateQuantity, validateRequired } from "@/utils/validators";
import { findProductByBarcode } from "@/utils/barcode";
import { ScanButton } from "@/components/ScanButton";
import { useFeedback } from "@/context/FeedbackContext";
import { digitsOnly } from "@/utils/numberInput";

export function Sales() {
  const { toast } = useFeedback();
  const [products, setProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([{ productId: '', quantity: 1, unitPrice: 0 }]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  // El escáner puede leer varios códigos antes de que React vuelva a renderizar:
  // se trabaja sobre la última lista, no sobre la del render anterior.
  const itemsRef = useRef(items);
  itemsRef.current = items;

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

  // Código leído por la cámara: agrega el producto a la venta o suma una unidad si
  // ya estaba. Devuelve el resultado para mostrarlo en el diálogo del escáner.
  const handleScan = (code) => {
    const product = findProductByBarcode(products, code);
    if (!product) return { ok: false, message: `No hay un producto con el código ${code}` };
    if (!product.active) return { ok: false, message: `${product.name} está dado de baja` };

    const current = itemsRef.current;
    const id = String(product.productId);
    const existing = current.findIndex((item) => item.productId === id);

    if (existing >= 0) {
      const quantity = Number(current[existing].quantity) + 1;
      const quantityError = validateQuantity(quantity, product.stock);
      if (quantityError) return { ok: false, message: `${product.name}: ${quantityError}` };
      const next = current.map((item, i) => (i === existing ? { ...item, quantity } : item));
      itemsRef.current = next;
      setItems(next);
      return { ok: true, message: `${product.name}: ${quantity} unidades` };
    }

    if (product.stock < 1) return { ok: false, message: `${product.name} está agotado` };
    const row = { productId: id, quantity: 1, unitPrice: product.price || 0 };
    // La fila vacía inicial se reutiliza en vez de dejarla sin producto.
    const next = current.length === 1 && !current[0].productId ? [row] : [...current, row];
    itemsRef.current = next;
    setItems(next);
    return { ok: true, message: `Agregado: ${product.name}` };
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
      toast.error(customerError);
      return;
    }

    const emailError = validateEmail(customerEmail, { optional: true });
    if (emailError) {
      toast.error(emailError);
      return;
    }

    // Stock pedido por producto (el mismo producto puede repetirse en varias filas).
    const requested = {};
    for (let i = 0; i < items.length; i++) {
      if (!items[i].productId) {
        toast.error(`Por favor selecciona un producto para la fila ${i + 1}`);
        return;
      }
      const productId = parseInt(items[i].productId);
      const product = products.find((p) => p.productId === productId);
      if (!product || !product.active) {
        toast.error(`El producto de la fila ${i + 1} no está disponible para la venta`);
        return;
      }
      requested[productId] = (requested[productId] || 0) + Number(items[i].quantity);
      const quantityError = validateQuantity(items[i].quantity, product.stock - (requested[productId] - Number(items[i].quantity)));
      if (quantityError) {
        toast.error(`Fila ${i + 1} (${product.name}): ${quantityError}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // El precio y el total los calcula el servidor con el precio vigente del
      // producto; aquí solo se envían producto y cantidad.
      const saleData = {
        customerName: customerName.trim(),
        // Con correo, el servidor envía el recibo de la venta a esa dirección.
        ...(customerEmail.trim() && { customerEmail: customerEmail.trim() }),
        items: items.map(item => ({
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity)
        }))
      };

      const sale = await saleService.create(saleData);
      const email = customerEmail.trim();

      setItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
      setCustomerName('');
      setCustomerEmail('');
      await fetchData();
      if (sale?.receiptStatus === 'ENVIADO') {
        toast.success(`Venta registrada. Recibo enviado a ${email}`);
      } else if (sale?.receiptStatus === 'NO_ENVIADO') {
        toast.info(`Venta registrada, pero no se pudo enviar el recibo a ${email}`);
      } else {
        toast.success('Venta registrada exitosamente');
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      const errorMsg = error.response?.data?.message || 
                       error.response?.data?.error || 
                       'Error al registrar la venta';
      toast.error(errorMsg);
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
              aria-label="Nombre del cliente"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              type="email"
              label="Correo del cliente (opcional, para enviarle el recibo)"
              aria-label="Correo del cliente"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Typography variant="h6" color="blue-gray">
              Productos
            </Typography>
            <ScanButton label="Escanear producto" title="Escanear productos de la venta" continuous onDetected={handleScan} />
          </div>

          {items.map((item, index) => (
            <div key={index} className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <div className="min-w-0 flex-1 [&>div]:!min-w-0">
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
              </div>

              <div className="w-full md:w-32 [&>div]:!min-w-0">
                <Input
                  label="Cantidad"
                  aria-label="Cantidad"
                  inputMode="numeric"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', digitsOnly(e.target.value))}
                />
              </div>

              {/* El precio es el del catálogo: el servidor lo fija, no se edita aquí. */}
              <Typography variant="small" color="blue-gray" className="whitespace-nowrap font-normal md:w-36">
                Precio: Q{Number(item.unitPrice || 0).toFixed(2)}
              </Typography>

              <Typography variant="small" color="blue-gray" className="whitespace-nowrap font-bold md:w-36">
                Total: Q{(item.unitPrice * (Number(item.quantity) || 0)).toFixed(2)}
              </Typography>

              {items.length > 1 && (
                <Button color="red" variant="text" size="sm" onClick={() => removeItem(index)}>
                  Eliminar
                </Button>
              )}
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
              Total de la Venta: Q{items.reduce((sum, item) => sum + (item.unitPrice * (Number(item.quantity) || 0)), 0).toFixed(2)}
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