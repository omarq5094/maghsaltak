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

CREATE TABLE workers (
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
  receipt_method VARCHAR(20) NOT NULL CHECK (
    receipt_method IN ('branch_pickup', 'home_delivery')
  ),
  delivery_address VARCHAR(500),
  delivery_at TIMESTAMP,
  courier_id BIGINT REFERENCES couriers(id),
  status VARCHAR(30) NOT NULL DEFAULT 'جديد' CHECK (status IN (
    'جديد', 'بانتظار الاستلام', 'تم الاستلام', 'تحت المعالجة',
    'جاهز', 'بالتوصيل', 'تم التسليم'
  )),
  received_by_worker_id BIGINT REFERENCES workers(id),
  received_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  UNIQUE (id, source),
  CHECK (
    (receipt_method = 'branch_pickup'
      AND delivery_address IS NULL
      AND delivery_at IS NULL)
    OR
    (receipt_method = 'home_delivery'
      AND delivery_address IS NOT NULL
      AND delivery_at IS NOT NULL)
  ),
  CHECK (
    (received_by_worker_id IS NULL AND received_at IS NULL)
    OR
    (received_by_worker_id IS NOT NULL AND received_at IS NOT NULL)
  ),
  CHECK (
    status IN ('جديد', 'بانتظار الاستلام')
    OR (received_by_worker_id IS NOT NULL AND received_at IS NOT NULL)
  )
);

CREATE TABLE order_items (
  id BIGINT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  order_source VARCHAR(20) NOT NULL CHECK (order_source IN ('customer', 'kiosk')),
  item_type_id BIGINT REFERENCES item_types(id),
  custom_item_name VARCHAR(200),
  service_id BIGINT NOT NULL REFERENCES services(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  unit_price DECIMAL(10, 2) CHECK (unit_price >= 0),
  FOREIGN KEY (order_id, order_source) REFERENCES orders(id, source),
  FOREIGN KEY (item_type_id, service_id)
    REFERENCES service_prices(item_type_id, service_id),
  CHECK (
    (item_type_id IS NOT NULL AND custom_item_name IS NULL)
    OR
    (item_type_id IS NULL
      AND custom_item_name IS NOT NULL
      AND TRIM(custom_item_name) <> '')
  ),
  CHECK (item_type_id IS NULL OR unit_price IS NOT NULL),
  CHECK (is_urgent = FALSE OR order_source = 'kiosk')
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
-- عندما تكون custom_item_name موجودة، تمثل البند "قطعة أخرى"، ويمكن أن يبقى
-- unit_price فارغًا إلى أن تحدد المغسلة السعر لاحقًا.
