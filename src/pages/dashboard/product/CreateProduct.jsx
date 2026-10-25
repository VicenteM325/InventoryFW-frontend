import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Input,
  Textarea,
  Button,
  Select,
  Option,
} from "@material-tailwind/react";
import { productService } from "@/services/productService";
import { ScanButton } from "@/components/ScanButton";
import { supplierService } from "@/services/supplierService";
import { useFeedback } from "@/context/FeedbackContext";
import { digitsOnly, decimalOnly } from "@/utils/numberInput";

const EMPTY_FORM = {
  name: '',
  barcode: '',
  description: '',
  stock: '',
  price: '',
  category: '',
  minStock: '',
  supplierId: '',
};

export function CreateProduct() {
  const { toast } = useFeedback();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    supplierService.getAll().then(setSuppliers).catch(() => setSuppliers([]));
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!formData.barcode.trim()) newErrors.barcode = 'El código de barras es obligatorio';
    if (formData.stock === '') newErrors.stock = 'El stock es obligatorio';
    if (formData.price === '' || Number(formData.price) < 0) newErrors.price = 'El precio es obligatorio';
    if (!formData.category) newErrors.category = 'La categoría es obligatoria';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stock' || name === 'minStock' ? digitsOnly(value)
        : name === 'price' ? decimalOnly(value)
        : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Código leído por la cámara: rellena el campo y limpia su error.
  const handleScannedBarcode = (code) => {
    setFormData((prev) => ({ ...prev, barcode: code }));
    setErrors((prev) => ({ ...prev, barcode: undefined }));
    return { ok: true, message: `Código leído: ${code}` };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await productService.create({
        ...formData,
        stock: parseInt(formData.stock, 10),
        minStock: formData.minStock === '' ? null : parseInt(formData.minStock, 10),
        price: parseFloat(formData.price),
        supplierId: formData.supplierId ? parseInt(formData.supplierId) : null,
      });
      navigate('/dashboard/products');
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error(error.response?.data?.message || 'Error al crear el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-12">
      <Card className="p-8">
        <Typography variant="h4" color="blue-gray" className="mb-6">
          Nuevo Producto
        </Typography>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Input
                label="Nombre del producto"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
              />
              {errors.name && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.name}
                </Typography>
              )}
            </div>

            <div>
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                <Input
                  label="Código de barras"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  error={!!errors.barcode}
                />
                </div>
                <ScanButton title="Escanear código del producto" onDetected={handleScannedBarcode} />
              </div>
              {errors.barcode && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.barcode}
                </Typography>
              )}
            </div>
          </div>

          <div>
            <Textarea
              label="Descripción"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Select
                label="Categoría"
                value={formData.category}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, category: value }));
                  setErrors(prev => ({ ...prev, category: '' }));
                }}
              >
                <Option value="CELULAR">Celular</Option>
                <Option value="ACCESORIO">Accesorio</Option>
              </Select>
              {errors.category && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.category}
                </Typography>
              )}
            </div>

            <div>
              <Select
                label="Proveedor (opcional)"
                value={formData.supplierId}
                onChange={(value) => setFormData(prev => ({ ...prev, supplierId: value }))}
              >
                {suppliers.map((supplier) => (
                  <Option key={supplier.supplierId} value={supplier.supplierId.toString()}>
                    {supplier.name}
                  </Option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <Input
                label="Precio de venta (Q)"
                inputMode="decimal"
                name="price"
                value={formData.price}
                onChange={handleChange}
                error={!!errors.price}
              />
              {errors.price && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.price}
                </Typography>
              )}
            </div>

            <div>
              <Input
                label="Stock inicial"
                inputMode="numeric"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                error={!!errors.stock}
              />
              {errors.stock && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.stock}
                </Typography>
              )}
            </div>

            <div>
              <Input
                label="Stock mínimo"
                inputMode="numeric"
                name="minStock"
                value={formData.minStock}
                onChange={handleChange}
              />
              <Typography variant="small" color="gray" className="mt-1 font-normal">
                Opcional: si lo dejas vacío se usa el mínimo por defecto.
              </Typography>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="text"
              color="blue-gray"
              onClick={() => navigate('/dashboard/products')}
            >
              Cancelar
            </Button>
            <Button type="submit" color="blue" disabled={loading}>
              {loading ? 'Guardando...' : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
