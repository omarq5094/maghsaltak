-- مخطط منطقي مشترك؛ يُراجع نوع الأعمدة وتوليد المعرّفات عند اختيار محرك قاعدة البيانات.
-- لا توجد هنا بيانات أولية أو اتصال بقاعدة بيانات.

CREATE TABLE services (
  id BIGINT PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE
);

CREATE TABLE item_types (
  id BIGINT PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE
);

CREATE TABLE service_prices (
  item_type_id BIGINT NOT NULL REFERENCES item_types(id),
  service_id BIGINT NOT NULL REFERENCES services(id),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  PRIMARY KEY (item_type_id, service_id)
);

CREATE TABLE couriers (
  id BIGINT PRIMARY KEY,
  name VARCHAR(200) NOT NULL
);

CREATE TABLE orders (
  id BIGINT PRIMARY KEY,
  source VARCHAR(20) NOT NULL CHECK (source IN ('customer', 'kiosk')),
  customer_name VARCHAR(200),
  customer_phone VARCHAR(30),
  pickup_address VARCHAR(500),
  pickup_at TIMESTAMP,
  courier_id BIGINT REFERENCES couriers(id),
  status VARCHAR(30) NOT NULL DEFAULT 'جديد' CHECK (status IN (
    'جديد', 'بانتظار الاستلام', 'تم الاستلام', 'تحت المعالجة',
    'جاهز', 'بالتوصيل', 'تم التسليم'
  )),
  received_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE order_items (
  id BIGINT PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id),
  item_type_id BIGINT NOT NULL,
  service_id BIGINT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  FOREIGN KEY (item_type_id, service_id)
    REFERENCES service_prices(item_type_id, service_id)
);

CREATE TABLE order_status_history (
  id BIGINT PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id),
  status VARCHAR(30) NOT NULL CHECK (status IN (
    'جديد', 'بانتظار الاستلام', 'تم الاستلام', 'تحت المعالجة',
    'جاهز', 'بالتوصيل', 'تم التسليم'
  )),
  changed_at TIMESTAMP NOT NULL
);

-- التقارير تُستخرج من الطلبات وبنودها وحالاتها؛ لا تحتاج إلى جدول مستقل الآن.
