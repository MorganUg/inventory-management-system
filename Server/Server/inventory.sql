--
-- PostgreSQL database dump
--

\restrict 1LTvp5MelrNFtm8nJcndgF23tIfUpGs2EW72oiA9YyMP4kjcPMmOdB3WrKiM6Xc

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: batch_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.batch_status AS ENUM (
    'planned',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE public.batch_status OWNER TO postgres;

--
-- Name: dispatch_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.dispatch_status AS ENUM (
    'pending',
    'dispatched',
    'cancelled'
);


ALTER TYPE public.dispatch_status OWNER TO postgres;

--
-- Name: populate_batch_from_bom(integer, integer, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.populate_batch_from_bom(p_batch_id integer, p_finished_good_id integer, p_quantity numeric) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO batch_materials (batch_id, material_id, quantity_used)
    SELECT
        p_batch_id,
        bi.material_id,
        bi.quantity_per_unit * p_quantity
    FROM bom_items bi
    JOIN bom b ON b.id = bi.bom_id
    WHERE b.finished_good_id = p_finished_good_id
      AND b.is_active = TRUE
    ON CONFLICT (batch_id, material_id)
    DO UPDATE SET quantity_used = EXCLUDED.quantity_used;
END;
$$;


ALTER FUNCTION public.populate_batch_from_bom(p_batch_id integer, p_finished_good_id integer, p_quantity numeric) OWNER TO postgres;

--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at() OWNER TO postgres;

--
-- Name: active_batches; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.active_batches AS
SELECT
    NULL::integer AS id,
    NULL::character varying(200) AS batch_name,
    NULL::public.batch_status AS status,
    NULL::numeric(10,2) AS expected_yield,
    NULL::date AS start_date,
    NULL::character varying(50) AS created_by,
    NULL::bigint AS materials_count;


ALTER VIEW public.active_batches OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: batch_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.batch_materials (
    id integer NOT NULL,
    batch_id integer NOT NULL,
    material_id integer NOT NULL,
    quantity_used numeric(10,2) NOT NULL,
    CONSTRAINT batch_materials_quantity_used_check CHECK ((quantity_used > (0)::numeric))
);


ALTER TABLE public.batch_materials OWNER TO postgres;

--
-- Name: batch_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.batch_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.batch_materials_id_seq OWNER TO postgres;

--
-- Name: batch_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.batch_materials_id_seq OWNED BY public.batch_materials.id;


--
-- Name: batch_outputs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.batch_outputs (
    id integer NOT NULL,
    batch_id integer NOT NULL,
    finished_good_id integer NOT NULL,
    expected_quantity numeric(10,2),
    actual_quantity numeric(10,2),
    production_date date DEFAULT CURRENT_DATE,
    expiry_date date
);


ALTER TABLE public.batch_outputs OWNER TO postgres;

--
-- Name: batch_outputs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.batch_outputs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.batch_outputs_id_seq OWNER TO postgres;

--
-- Name: batch_outputs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.batch_outputs_id_seq OWNED BY public.batch_outputs.id;


--
-- Name: bom; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bom (
    id integer NOT NULL,
    finished_good_id integer NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true,
    notes text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.bom OWNER TO postgres;

--
-- Name: bom_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bom_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bom_id_seq OWNER TO postgres;

--
-- Name: bom_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bom_id_seq OWNED BY public.bom.id;


--
-- Name: bom_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bom_items (
    id integer NOT NULL,
    bom_id integer NOT NULL,
    material_id integer NOT NULL,
    quantity_per_unit numeric(10,4) NOT NULL,
    unit character varying(20) NOT NULL,
    notes text,
    CONSTRAINT bom_items_quantity_per_unit_check CHECK ((quantity_per_unit > (0)::numeric))
);


ALTER TABLE public.bom_items OWNER TO postgres;

--
-- Name: bom_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bom_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bom_items_id_seq OWNER TO postgres;

--
-- Name: bom_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bom_items_id_seq OWNED BY public.bom_items.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(20) DEFAULT 'raw_material'::character varying NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    contact_name character varying(100),
    phone character varying(20),
    email character varying(100),
    address text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: dispatches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dispatches (
    id integer NOT NULL,
    finished_good_id integer NOT NULL,
    customer_id integer,
    quantity_dispatched numeric(10,2) NOT NULL,
    status public.dispatch_status DEFAULT 'pending'::public.dispatch_status,
    dispatched_by integer,
    notes text,
    dispatched_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dispatches_quantity_dispatched_check CHECK ((quantity_dispatched > (0)::numeric))
);


ALTER TABLE public.dispatches OWNER TO postgres;

--
-- Name: dispatches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dispatches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dispatches_id_seq OWNER TO postgres;

--
-- Name: dispatches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dispatches_id_seq OWNED BY public.dispatches.id;


--
-- Name: finished_goods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.finished_goods (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    unit character varying(20) DEFAULT 'pieces'::character varying NOT NULL,
    quantity_in_stock numeric(10,2) DEFAULT 0 NOT NULL,
    price_per_unit numeric(10,2) DEFAULT 0,
    category_id integer,
    expiry_duration_days integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.finished_goods OWNER TO postgres;

--
-- Name: finished_goods_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.finished_goods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finished_goods_id_seq OWNER TO postgres;

--
-- Name: finished_goods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.finished_goods_id_seq OWNED BY public.finished_goods.id;


--
-- Name: finished_goods_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.finished_goods_summary AS
 SELECT fg.id,
    fg.name,
    fg.unit,
    fg.quantity_in_stock,
    fg.price_per_unit,
    fg.expiry_duration_days,
    c.name AS category
   FROM (public.finished_goods fg
     LEFT JOIN public.categories c ON ((c.id = fg.category_id)));


ALTER VIEW public.finished_goods_summary OWNER TO postgres;

--
-- Name: raw_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.raw_materials (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    unit character varying(20) NOT NULL,
    quantity_in_stock numeric(10,2) DEFAULT 0 NOT NULL,
    reorder_level numeric(10,2) DEFAULT 0 NOT NULL,
    cost_per_unit numeric(10,2) DEFAULT 0 NOT NULL,
    category_id integer,
    supplier_id integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.raw_materials OWNER TO postgres;

--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    contact_name character varying(100),
    phone character varying(20),
    email character varying(100),
    address text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- Name: low_stock_materials; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.low_stock_materials AS
 SELECT rm.id,
    rm.name,
    rm.unit,
    rm.quantity_in_stock,
    rm.reorder_level,
    s.name AS supplier_name,
    s.phone AS supplier_phone
   FROM (public.raw_materials rm
     LEFT JOIN public.suppliers s ON ((s.id = rm.supplier_id)))
  WHERE (rm.quantity_in_stock <= rm.reorder_level);


ALTER VIEW public.low_stock_materials OWNER TO postgres;

--
-- Name: predictions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.predictions (
    id integer NOT NULL,
    finished_good_id integer NOT NULL,
    prediction_date date NOT NULL,
    predicted_quantity integer NOT NULL,
    model_version character varying(50),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.predictions OWNER TO postgres;

--
-- Name: predictions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.predictions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.predictions_id_seq OWNER TO postgres;

--
-- Name: predictions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.predictions_id_seq OWNED BY public.predictions.id;


--
-- Name: production_batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.production_batches (
    id integer NOT NULL,
    batch_name character varying(200) NOT NULL,
    status public.batch_status DEFAULT 'planned'::public.batch_status NOT NULL,
    expected_yield numeric(10,2),
    actual_yield numeric(10,2),
    start_date date,
    end_date date,
    created_by integer,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.production_batches OWNER TO postgres;

--
-- Name: production_batches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.production_batches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.production_batches_id_seq OWNER TO postgres;

--
-- Name: production_batches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.production_batches_id_seq OWNED BY public.production_batches.id;


--
-- Name: raw_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.raw_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.raw_materials_id_seq OWNER TO postgres;

--
-- Name: raw_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.raw_materials_id_seq OWNED BY public.raw_materials.id;


--
-- Name: restocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.restocks (
    id integer NOT NULL,
    material_id integer NOT NULL,
    supplier_id integer,
    quantity_received numeric(10,2) NOT NULL,
    cost_per_unit numeric(10,2) NOT NULL,
    total_cost numeric(12,2) GENERATED ALWAYS AS ((quantity_received * cost_per_unit)) STORED,
    received_by integer,
    notes text,
    received_at timestamp with time zone DEFAULT now(),
    CONSTRAINT restocks_quantity_received_check CHECK ((quantity_received > (0)::numeric))
);


ALTER TABLE public.restocks OWNER TO postgres;

--
-- Name: restocks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.restocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.restocks_id_seq OWNER TO postgres;

--
-- Name: restocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.restocks_id_seq OWNED BY public.restocks.id;


--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_movements (
    id integer NOT NULL,
    item_type character varying(20) NOT NULL,
    item_id integer NOT NULL,
    quantity numeric(10,2) NOT NULL,
    movement_type character varying(50) NOT NULL,
    reference_id integer,
    notes text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT stock_movements_item_type_check CHECK (((item_type)::text = ANY ((ARRAY['raw_material'::character varying, 'finished_good'::character varying])::text[]))),
    CONSTRAINT stock_movements_movement_type_check CHECK (((movement_type)::text = ANY ((ARRAY['restock'::character varying, 'production_use'::character varying, 'production_output'::character varying, 'dispatch'::character varying])::text[])))
);


ALTER TABLE public.stock_movements OWNER TO postgres;

--
-- Name: stock_movement_history; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.stock_movement_history AS
 SELECT sm.id,
    sm.item_type,
    sm.item_id,
        CASE
            WHEN ((sm.item_type)::text = 'raw_material'::text) THEN rm.name
            WHEN ((sm.item_type)::text = 'finished_good'::text) THEN fg.name
            ELSE NULL::character varying
        END AS item_name,
    sm.quantity,
    sm.movement_type,
    sm.reference_id,
    sm.notes,
    sm.created_at
   FROM ((public.stock_movements sm
     LEFT JOIN public.raw_materials rm ON ((((sm.item_type)::text = 'raw_material'::text) AND (rm.id = sm.item_id))))
     LEFT JOIN public.finished_goods fg ON ((((sm.item_type)::text = 'finished_good'::text) AND (fg.id = sm.item_id))))
  ORDER BY sm.created_at DESC;


ALTER VIEW public.stock_movement_history OWNER TO postgres;

--
-- Name: stock_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stock_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_movements_id_seq OWNER TO postgres;

--
-- Name: stock_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stock_movements_id_seq OWNED BY public.stock_movements.id;


--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suppliers_id_seq OWNER TO postgres;

--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'staff'::character varying NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_login_at timestamp with time zone,
    force_password_change boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: COLUMN users.last_login_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.last_login_at IS 'Timestamp of the user''s most recent successful login';


--
-- Name: COLUMN users.force_password_change; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.force_password_change IS 'If true, user must change their password on next login (set by admin on create or reset)';


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: batch_materials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.batch_materials ALTER COLUMN id SET DEFAULT nextval('public.batch_materials_id_seq'::regclass);


--
-- Name: batch_outputs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.batch_outputs ALTER COLUMN id SET DEFAULT nextval('public.batch_outputs_id_seq'::regclass);


--
-- Name: bom id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom ALTER COLUMN id SET DEFAULT nextval('public.bom_id_seq'::regclass);


--
-- Name: bom_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom_items ALTER COLUMN id SET DEFAULT nextval('public.bom_items_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: dispatches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispatches ALTER COLUMN id SET DEFAULT nextval('public.dispatches_id_seq'::regclass);


--
-- Name: finished_goods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finished_goods ALTER COLUMN id SET DEFAULT nextval('public.finished_goods_id_seq'::regclass);


--
-- Name: predictions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictions ALTER COLUMN id SET DEFAULT nextval('public.predictions_id_seq'::regclass);


--
-- Name: production_batches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_batches ALTER COLUMN id SET DEFAULT nextval('public.production_batches_id_seq'::regclass);


--
-- Name: raw_materials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raw_materials ALTER COLUMN id SET DEFAULT nextval('public.raw_materials_id_seq'::regclass);


--
-- Name: restocks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restocks ALTER COLUMN id SET DEFAULT nextval('public.restocks_id_seq'::regclass);


--
-- Name: stock_movements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements ALTER COLUMN id SET DEFAULT nextval('public.stock_movements_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: batch_materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.batch_materials (id, batch_id, material_id, quantity_used) FROM stdin;
1	4	1	10.00
2	4	3	4.00
3	4	4	1.00
4	4	8	200.00
5	5	1	10.00
6	5	3	4.00
7	5	4	1.00
8	5	8	200.00
9	7	5	22.00
10	7	1	45.00
11	7	3	44.00
12	7	6	30.00
13	8	4	12.50
14	8	1	14.50
15	8	6	15.00
\.


--
-- Data for Name: batch_outputs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.batch_outputs (id, batch_id, finished_good_id, expected_quantity, actual_quantity, production_date, expiry_date) FROM stdin;
2	5	2	200.00	\N	2026-05-30	2026-08-28
1	4	2	200.00	195.00	2026-05-30	2026-08-28
3	7	3	1000.00	1000.00	2026-06-07	2026-10-04
4	8	4	500.00	500.00	2026-06-07	2026-10-04
\.


--
-- Data for Name: bom; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bom (id, finished_good_id, version, is_active, notes, created_by, created_at, updated_at) FROM stdin;
2	2	1	t	Original recipe	1	2026-05-30 14:00:27.264824+03	2026-05-30 14:00:27.264824+03
3	3	1	t	Milk or dark chocolate	5	2026-06-06 23:55:24.320475+03	2026-06-06 23:55:24.320475+03
4	4	1	t	Dark cholate recipe	5	2026-06-07 00:10:02.94309+03	2026-06-07 00:10:02.94309+03
\.


--
-- Data for Name: bom_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bom_items (id, bom_id, material_id, quantity_per_unit, unit, notes) FROM stdin;
3	2	1	0.0500	kg	\N
4	2	3	0.0200	litres	\N
5	2	4	0.0050	kg	\N
6	2	8	1.0000	pieces	\N
7	3	5	0.0220	kg	Main Fat
8	3	1	0.0450	kg	Sweetener
9	3	3	0.0440	litres	Creamy taste
10	3	6	0.0300	litres	Flavor enhancer
11	4	4	0.0250	kg	none
12	4	1	0.0290	kg	none
13	4	6	0.0300	litres	none
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, type, description, created_at) FROM stdin;
1	Sweeteners	raw_material	Sugar, honey, syrups	2026-04-17 01:21:04.442941+03
2	Dairy	raw_material	Milk, butter, cream	2026-04-17 01:21:04.562405+03
3	Flavourings	raw_material	Vanilla, cocoa, fruit extracts	2026-04-17 01:21:04.572621+03
4	Fats & Oils	raw_material	Vegetable oil, palm oil	2026-04-17 01:21:04.574402+03
5	Packaging	raw_material	Wrappers, boxes, bags	2026-04-17 01:21:04.576263+03
6	Hard Candy	finished_good	Boiled sweets and lollipops	2026-04-17 01:21:04.578274+03
7	Soft Candy	finished_good	Toffees, chews, gummies	2026-04-17 01:21:04.580137+03
8	Chocolate	finished_good	Chocolate based products	2026-04-17 01:21:04.581697+03
9	Confectionery	finished_good	Mixed sweet products	2026-04-17 01:21:04.583122+03
10	Lollipops	finished_good	Lolly types of sweets	2026-04-19 21:48:01.28575+03
12	Toffees and Caramels	finished_good	Butter milk candies	2026-04-19 21:53:38.952136+03
13	Bubble Gums	finished_good	fruit flavored bubble	2026-04-19 21:58:12.202296+03
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, contact_name, phone, email, address, is_active, created_at, updated_at) FROM stdin;
1	Mrs Alice	Alice Nakato	0791064257	alicenakato@gmail.com	kikuubo, Kampala	t	2026-04-17 01:21:04.698144+03	2026-04-17 01:21:04.698144+03
2	Carrefour Uganda	Fatima Hassan	0200900100	orders@carrefour.ug	Oasis Mall, Kampala	t	2026-04-17 01:21:04.757143+03	2026-04-17 01:21:04.757143+03
3	Kwik Save Stores	Moses Bwire	0782334455	moses@kwiksave.ug	Entebbe Road, Kampala	t	2026-04-17 01:21:04.759044+03	2026-04-17 01:21:04.759044+03
5	Isaac Sweets	Isaac 	0791064752	isaacsweets@gmail.com	Kikuubo, Ssembatya Complex	t	2026-04-21 22:49:59.874665+03	2026-04-21 22:49:59.874665+03
6	Namugema Sarah	Sarah Kikuubo	0791565567	sarahnamugema@gmail.com	Kikuubo, Kamapala	t	2026-05-30 17:47:55.180073+03	2026-05-30 17:47:55.180073+03
\.


--
-- Data for Name: dispatches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dispatches (id, finished_good_id, customer_id, quantity_dispatched, status, dispatched_by, notes, dispatched_at) FROM stdin;
1	2	1	50.00	dispatched	1	Dipatch for Mrs Alice, kikuubo	2026-05-30 14:17:35.323579+03
2	2	6	50.00	dispatched	1	Dilivery to Sarah kikuubo	2026-05-30 18:48:54.585024+03
3	4	1	300.00	dispatched	5	Delivery for Alice kikuubo	2026-06-07 00:36:19.053126+03
\.


--
-- Data for Name: finished_goods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.finished_goods (id, name, unit, quantity_in_stock, price_per_unit, category_id, expiry_duration_days, created_at, updated_at) FROM stdin;
2	Milk Candy	pieces	95.00	500.00	7	90	2026-05-30 13:59:54.702147+03	2026-05-30 18:48:54.585024+03
3	Milk Chocolate Bars	pieces	1000.00	1000.00	8	120	2026-06-06 23:55:00.218495+03	2026-06-07 00:07:19.964406+03
4	Dark Choclate Bar	pieces	200.00	1000.00	8	120	2026-06-07 00:08:51.772982+03	2026-06-07 00:36:19.053126+03
\.


--
-- Data for Name: predictions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.predictions (id, finished_good_id, prediction_date, predicted_quantity, model_version, created_at) FROM stdin;
\.


--
-- Data for Name: production_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.production_batches (id, batch_name, status, expected_yield, actual_yield, start_date, end_date, created_by, notes, created_at, updated_at) FROM stdin;
1	Numbers Candy	cancelled	2000.00	\N	2026-05-30	\N	1	\N	2026-05-29 21:37:51.860947+03	2026-05-30 00:12:33.790606+03
2	Numbers Candy	cancelled	2000.00	\N	2026-05-30	\N	1	Production for Alice	2026-05-30 00:13:33.624835+03	2026-05-30 00:38:47.181094+03
3	Numbers Candy	in_progress	2000.00	\N	2026-05-30	\N	1	Production for Alice Kikuubo	2026-05-30 00:39:33.943009+03	2026-05-30 00:55:36.931277+03
5	Milk Candy	planned	200.00	\N	2026-05-30	\N	1	Production for Kikuubo customer	2026-05-30 14:04:16.752328+03	2026-05-30 14:04:16.752328+03
4	Milk Candy	completed	200.00	195.00	2026-05-30	2026-05-30	1	Production for Kikuubo customer	2026-05-30 14:03:53.728106+03	2026-05-30 14:15:58.365089+03
6	Milk Candy	cancelled	200.00	\N	2026-05-30	\N	1	Production for Makerere customer	2026-05-30 14:14:24.422438+03	2026-05-30 18:53:07.408006+03
7	Milk Cholate - June run	completed	1000.00	1000.00	2026-06-07	2026-06-07	5	Milk Chocolate Bars for kikuubo during the course of june	2026-06-07 00:06:58.670941+03	2026-06-07 00:07:19.964406+03
8	Dark Cholate - June run	completed	1000.00	500.00	2026-06-07	2026-06-07	5	Dark cholate production for June Run	2026-06-07 00:15:48.494763+03	2026-06-07 00:16:04.71719+03
\.


--
-- Data for Name: raw_materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.raw_materials (id, name, unit, quantity_in_stock, reorder_level, cost_per_unit, category_id, supplier_id, created_at, updated_at) FROM stdin;
2	Glucose Syrup	kg	200.00	50.00	8000.00	1	1	2026-04-17 01:21:05.310968+03	2026-04-17 01:21:05.310968+03
7	Vegetable Oil	litres	100.00	25.00	7000.00	4	3	2026-04-17 01:21:05.324479+03	2026-04-17 01:21:05.324479+03
9	Cardboard Boxes	pieces	300.00	80.00	1500.00	5	4	2026-04-17 01:21:05.328052+03	2026-04-17 01:21:05.328052+03
14	Vinegar Fluids	litres	167.00	100.00	10000.00	1	3	2026-04-18 21:42:47.315832+03	2026-04-18 22:31:16.713313+03
8	Candy Wrappers	pieces	9805.00	2000.00	50.00	5	4	2026-04-17 01:21:05.326268+03	2026-05-30 14:15:58.365089+03
5	Cocoa Powder	kg	38.00	15.00	25000.00	3	3	2026-04-17 01:21:05.319439+03	2026-06-07 00:07:19.964406+03
3	Full Cream Milk	litres	102.10	40.00	2500.00	2	2	2026-04-17 01:21:05.313693+03	2026-06-07 00:07:19.964406+03
4	Butter	kg	72.78	20.00	18000.00	2	2	2026-04-17 01:21:05.316462+03	2026-06-07 00:16:04.71719+03
1	White Sugar	kg	438.00	100.00	3500.00	1	1	2026-04-17 01:21:04.816423+03	2026-06-07 00:16:04.71719+03
6	Vanilla Essence	litres	-27.50	3.00	45000.00	3	3	2026-04-17 01:21:05.321806+03	2026-06-07 00:16:04.71719+03
\.


--
-- Data for Name: restocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.restocks (id, material_id, supplier_id, quantity_received, cost_per_unit, received_by, notes, received_at) FROM stdin;
\.


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_movements (id, item_type, item_id, quantity, movement_type, reference_id, notes, created_by, created_at) FROM stdin;
1	raw_material	1	-9.75	production_use	4	\N	1	2026-05-30 14:15:58.365089+03
2	raw_material	3	-3.90	production_use	4	\N	1	2026-05-30 14:15:58.365089+03
3	raw_material	4	-0.98	production_use	4	\N	1	2026-05-30 14:15:58.365089+03
4	raw_material	8	-195.00	production_use	4	\N	1	2026-05-30 14:15:58.365089+03
5	finished_good	2	195.00	production_output	4	\N	1	2026-05-30 14:15:58.365089+03
6	finished_good	2	-50.00	dispatch	1	\N	1	2026-05-30 14:17:35.323579+03
7	finished_good	2	-50.00	dispatch	2	\N	1	2026-05-30 18:48:54.585024+03
8	raw_material	5	-22.00	production_use	7	\N	5	2026-06-07 00:07:19.964406+03
9	raw_material	1	-45.00	production_use	7	\N	5	2026-06-07 00:07:19.964406+03
10	raw_material	3	-44.00	production_use	7	\N	5	2026-06-07 00:07:19.964406+03
11	raw_material	6	-30.00	production_use	7	\N	5	2026-06-07 00:07:19.964406+03
12	finished_good	3	1000.00	production_output	7	\N	5	2026-06-07 00:07:19.964406+03
13	raw_material	4	-6.25	production_use	8	\N	5	2026-06-07 00:16:04.71719+03
14	raw_material	1	-7.25	production_use	8	\N	5	2026-06-07 00:16:04.71719+03
15	raw_material	6	-7.50	production_use	8	\N	5	2026-06-07 00:16:04.71719+03
16	finished_good	4	500.00	production_output	8	\N	5	2026-06-07 00:16:04.71719+03
17	finished_good	4	-300.00	dispatch	3	\N	5	2026-06-07 00:36:19.053126+03
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (id, name, contact_name, phone, email, address, is_active, created_at, updated_at) FROM stdin;
2	Pearl Dairy Ltd	Sarah Nambi	0772456789	info@pearldairy.co.ug	Mbarara, Western Uganda	t	2026-04-17 01:21:04.693739+03	2026-04-17 01:21:04.693739+03
3	Bidco Africa	Peter Otieno	0755987654	orders@bidco.co.ug	Jinja, Eastern Uganda	t	2026-04-17 01:21:04.695107+03	2026-04-17 01:21:04.695107+03
4	Kampala Packaging Ltd	Grace Akello	0414321654	grace@klapackaging.com	Nakawa Industrial Area, Kampala	t	2026-04-17 01:21:04.696333+03	2026-04-17 01:21:04.696333+03
1	Uganda Sugar Factory	John Mukasa	0700123456	sales@ugsugar.com	Lugazi, Buikwe District	t	2026-04-17 01:21:04.61328+03	2026-04-21 00:20:05.205332+03
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, role, is_active, created_at, updated_at, last_login_at, force_password_change) FROM stdin;
4	Morgan	lilmorgan256@gmail.com	$2b$10$UwA8g7vvuAgu7a7mgfa7y.CC81bbrCJRZh0bnn9T94fqP9.i1Ngpe	staff	t	2026-05-30 16:26:10.709376+03	2026-05-30 17:11:02.266143+03	2026-05-30 16:27:25.112473+03	f
1	admin	admin@candykingdom.com	$2b$10$6TCBal5IttYA7PmYXdQPF.9MqCazgInoBC0ynwGpv/Krfmm6n.qNe	admin	t	2026-04-17 01:21:03.58806+03	2026-06-06 23:05:33.916462+03	2026-06-06 23:05:33.916462+03	f
3	staff	staff@candykingdom.com	$2b$10$OPpYpmTQvTvbZmLcoAKpeemzkMDOsuuk8uW.X/DHsHCOAdNXJeXj6	staff	t	2026-04-17 01:21:04.440288+03	2026-06-06 23:11:17.225316+03	2026-06-06 23:11:17.225316+03	f
5	Ebasu Clement	ebasucelment@gmail.com	$2b$10$B0hMbrGypRcA43ZwvKWMneUh60VXDrUStWKryty9jNPMrcE6/xYAe	admin	t	2026-06-06 23:10:18.440709+03	2026-06-06 23:12:00.892471+03	2026-06-06 23:12:00.892471+03	t
6	Isaac 	isaac@candykingdom.com	$2b$10$blyxFPJZp9wgyab8FhAOEOGG1zjcsEiYyMGEls.r/3N4srUiHtXdO	manager	t	2026-06-07 00:17:49.83882+03	2026-06-07 00:17:49.83882+03	\N	t
\.


--
-- Name: batch_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.batch_materials_id_seq', 15, true);


--
-- Name: batch_outputs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.batch_outputs_id_seq', 4, true);


--
-- Name: bom_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bom_id_seq', 4, true);


--
-- Name: bom_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bom_items_id_seq', 13, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 13, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_id_seq', 6, true);


--
-- Name: dispatches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dispatches_id_seq', 3, true);


--
-- Name: finished_goods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.finished_goods_id_seq', 4, true);


--
-- Name: predictions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.predictions_id_seq', 1, false);


--
-- Name: production_batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.production_batches_id_seq', 8, true);


--
-- Name: raw_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.raw_materials_id_seq', 15, true);


--
-- Name: restocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.restocks_id_seq', 1, false);


--
-- Name: stock_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stock_movements_id_seq', 17, true);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: batch_materials batch_materials_batch_id_material_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.batch_materials
    ADD CONSTRAINT batch_materials_batch_id_material_id_key UNIQUE (batch_id, material_id);


--
-- Name: batch_materials batch_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.batch_materials
    ADD CONSTRAINT batch_materials_pkey PRIMARY KEY (id);


--
-- Name: batch_outputs batch_outputs_batch_id_finished_good_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.batch_outputs
    ADD CONSTRAINT batch_outputs_batch_id_finished_good_id_key UNIQUE (batch_id, finished_good_id);


--
-- Name: batch_outputs batch_outputs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.batch_outputs
    ADD CONSTRAINT batch_outputs_pkey PRIMARY KEY (id);


--
-- Name: bom_items bom_items_bom_id_material_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom_items
    ADD CONSTRAINT bom_items_bom_id_material_id_key UNIQUE (bom_id, material_id);


--
-- Name: bom_items bom_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom_items
    ADD CONSTRAINT bom_items_pkey PRIMARY KEY (id);


--
-- Name: bom bom_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom
    ADD CONSTRAINT bom_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: dispatches dispatches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispatches
    ADD CONSTRAINT dispatches_pkey PRIMARY KEY (id);


--
-- Name: finished_goods finished_goods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finished_goods
    ADD CONSTRAINT finished_goods_pkey PRIMARY KEY (id);


--
-- Name: predictions predictions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictions
    ADD CONSTRAINT predictions_pkey PRIMARY KEY (id);


--
-- Name: production_batches production_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_batches
    ADD CONSTRAINT production_batches_pkey PRIMARY KEY (id);


--
-- Name: raw_materials raw_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raw_materials
    ADD CONSTRAINT raw_materials_pkey PRIMARY KEY (id);


--
-- Name: restocks restocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restocks
    ADD CONSTRAINT restocks_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_batch_materials_batch; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_batch_materials_batch ON public.batch_materials USING btree (batch_id);


--
-- Name: idx_batch_materials_material; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_batch_materials_material ON public.batch_materials USING btree (material_id);


--
-- Name: idx_batch_outputs_batch; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_batch_outputs_batch ON public.batch_outputs USING btree (batch_id);


--
-- Name: idx_batch_outputs_good; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_batch_outputs_good ON public.batch_outputs USING btree (finished_good_id);


--
-- Name: idx_batches_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_batches_created_by ON public.production_batches USING btree (created_by);


--
-- Name: idx_batches_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_batches_status ON public.production_batches USING btree (status);


--
-- Name: idx_bom_active_version; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_bom_active_version ON public.bom USING btree (finished_good_id) WHERE (is_active = true);


--
-- Name: idx_bom_finished_good; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bom_finished_good ON public.bom USING btree (finished_good_id);


--
-- Name: idx_bom_items_bom; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bom_items_bom ON public.bom_items USING btree (bom_id);


--
-- Name: idx_bom_items_material; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bom_items_material ON public.bom_items USING btree (material_id);


--
-- Name: idx_customers_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_name ON public.customers USING btree (name);


--
-- Name: idx_dispatches_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dispatches_customer ON public.dispatches USING btree (customer_id);


--
-- Name: idx_dispatches_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dispatches_date ON public.dispatches USING btree (dispatched_at);


--
-- Name: idx_dispatches_good; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dispatches_good ON public.dispatches USING btree (finished_good_id);


--
-- Name: idx_finished_goods_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_finished_goods_category ON public.finished_goods USING btree (category_id);


--
-- Name: idx_predictions_good_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_predictions_good_date ON public.predictions USING btree (finished_good_id, prediction_date);


--
-- Name: idx_raw_materials_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raw_materials_category ON public.raw_materials USING btree (category_id);


--
-- Name: idx_raw_materials_supplier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raw_materials_supplier ON public.raw_materials USING btree (supplier_id);


--
-- Name: idx_restocks_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_restocks_date ON public.restocks USING btree (received_at);


--
-- Name: idx_restocks_material; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_restocks_material ON public.restocks USING btree (material_id);


--
-- Name: idx_stock_movements_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stock_movements_date ON public.stock_movements USING btree (created_at);


--
-- Name: idx_stock_movements_item; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stock_movements_item ON public.stock_movements USING btree (item_type, item_id);


--
-- Name: idx_stock_movements_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stock_movements_type ON public.stock_movements USING btree (movement_type);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_last_login; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_last_login ON public.users USING btree (last_login_at);


--
-- Name: active_batches _RETURN; Type: RULE; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW public.active_batches AS
 SELECT pb.id,
    pb.batch_name,
    pb.status,
    pb.expected_yield,
    pb.start_date,
    u.username AS created_by,
    count(bm.id) AS materials_count
   FROM ((public.production_batches pb
     LEFT JOIN public.users u ON ((u.id = pb.created_by)))
     LEFT JOIN public.batch_materials bm ON ((bm.batch_id = pb.id)))
  WHERE (pb.status = ANY (ARRAY['planned'::public.batch_status, 'in_progress'::public.batch_status]))
  GROUP BY pb.id, u.username;


--
-- Name: production_batches trg_batches_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_batches_updated_at BEFORE UPDATE ON public.production_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: bom trg_bom_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_bom_updated_at BEFORE UPDATE ON public.bom FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: customers trg_customers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: finished_goods trg_finished_goods_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_finished_goods_updated_at BEFORE UPDATE ON public.finished_goods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: raw_materials trg_raw_materials_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_raw_materials_updated_at BEFORE UPDATE ON public.raw_materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: suppliers trg_suppliers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: batch_materials batch_materials_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.batch_materials
    ADD CONSTRAINT batch_materials_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.production_batches(id) ON DELETE CASCADE;


--
-- Name: batch_materials batch_materials_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.batch_materials
    ADD CONSTRAINT batch_materials_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.raw_materials(id) ON DELETE CASCADE;


--
-- Name: batch_outputs batch_outputs_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.batch_outputs
    ADD CONSTRAINT batch_outputs_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.production_batches(id) ON DELETE CASCADE;


--
-- Name: batch_outputs batch_outputs_finished_good_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.batch_outputs
    ADD CONSTRAINT batch_outputs_finished_good_id_fkey FOREIGN KEY (finished_good_id) REFERENCES public.finished_goods(id) ON DELETE CASCADE;


--
-- Name: bom bom_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom
    ADD CONSTRAINT bom_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: bom_items bom_items_bom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom_items
    ADD CONSTRAINT bom_items_bom_id_fkey FOREIGN KEY (bom_id) REFERENCES public.bom(id) ON DELETE CASCADE;


--
-- Name: bom_items bom_items_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom_items
    ADD CONSTRAINT bom_items_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.raw_materials(id) ON DELETE CASCADE;


--
-- Name: dispatches dispatches_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispatches
    ADD CONSTRAINT dispatches_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: dispatches dispatches_dispatched_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispatches
    ADD CONSTRAINT dispatches_dispatched_by_fkey FOREIGN KEY (dispatched_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: dispatches dispatches_finished_good_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispatches
    ADD CONSTRAINT dispatches_finished_good_id_fkey FOREIGN KEY (finished_good_id) REFERENCES public.finished_goods(id) ON DELETE CASCADE;


--
-- Name: finished_goods finished_goods_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finished_goods
    ADD CONSTRAINT finished_goods_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: bom fk_bom_finished_good; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom
    ADD CONSTRAINT fk_bom_finished_good FOREIGN KEY (finished_good_id) REFERENCES public.finished_goods(id) ON DELETE CASCADE;


--
-- Name: predictions predictions_finished_good_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictions
    ADD CONSTRAINT predictions_finished_good_id_fkey FOREIGN KEY (finished_good_id) REFERENCES public.finished_goods(id) ON DELETE CASCADE;


--
-- Name: production_batches production_batches_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_batches
    ADD CONSTRAINT production_batches_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: raw_materials raw_materials_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raw_materials
    ADD CONSTRAINT raw_materials_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: raw_materials raw_materials_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raw_materials
    ADD CONSTRAINT raw_materials_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;


--
-- Name: restocks restocks_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restocks
    ADD CONSTRAINT restocks_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.raw_materials(id) ON DELETE CASCADE;


--
-- Name: restocks restocks_received_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restocks
    ADD CONSTRAINT restocks_received_by_fkey FOREIGN KEY (received_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: restocks restocks_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restocks
    ADD CONSTRAINT restocks_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;


--
-- Name: stock_movements stock_movements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict 1LTvp5MelrNFtm8nJcndgF23tIfUpGs2EW72oiA9YyMP4kjcPMmOdB3WrKiM6Xc

