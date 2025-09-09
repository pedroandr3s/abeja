-- DATA DE PRUEBA
--
-- Las claves se almacenan con el resultado de utilizar "Bcrypt": https://bcrypt-generator.com/
-- 

-- usuarios
INSERT INTO smartbee.usuario (id, clave, nombre, apellido, comuna, rol) VALUES 
    ('root'      , '$2a$12$jPfhj3cxKAPMqp3m1y18/e3led91OdH/F1kpSh3rk.WxSHDae2q.6', 'Roberto'  ,'Carrasco'  , 'Vitacura', 'ADM'),
    ('pdonald'   , '$2a$12$lVnpyJq0KI.zWyh1Y7PpyO408L71BMIJfaxi1DO/TOqfrWKIt/cgK', 'Patricio' , 'Donald'   , 'Chillán' , 'API'),
    ('mgonzalez' , '$2a$12$OlIZ4bsnKsbQSxL6/N/5n.YIuV3g.rBt2OGoSSoTUWpchpnlQVq3S', 'María'    , 'González' , 'Chillán' , 'API'),
    ('mhenriquez', '$2a$12$8pj/weZfzSka/aDYj0xYDuZWoJ86nQB7tQ2azI/OWJ5QRQiRuipAi', 'Matías'   , 'Henríquez', 'Chillán' , 'API'),
    ('jperez'    , '$2a$12$Elr90iUGQCfydss0oP4x1uEoJ/dc/KnOMxHCu8D3OmzYCpMIpIbyy', 'Juan'     , 'Pérez'    , 'Ovalle'  , 'API'),
    ('lmunoz'    , '$2a$12$0gR6fsTk90Iqv7rZsOnVkOZyVdRKCWpQp0S9Ldow.asgmQRybvB5m', 'Laura'    , 'Muñoz'    , 'Ovalle'  , 'API'),
    ('cramirez'  , '$2a$12$2GujqbbfnnK6xACcj1NYI.ncrZpaexq4v1z7NzCt8xA2riH7V4BHK', 'Carlos'   , 'Ramírez'  , 'Ovalle'  , 'API'),
    ('jrivas'    , '$2a$12$ZW5DmihmqoX0dWs/32JcI.fY8FgEQDMaHeTaDbBBB96zEE6/.9bNm', 'Josefa'   , 'Rivas'    , 'Rancagua', 'API'),
    ('storres'   , '$2a$12$5xJEuwVNljduNTG.QbJe5uBayxGjc2.wrpvOVrtl3xfSU/RdgyvC.', 'Sofía'    , 'Torres'   , 'Rancagua', 'API'),
    ('amorales'  , '$2a$12$wcQeVTFNP5RsqU5UdP8id.hIPIfD0sy3XFGmJswW7q2yhpJ12Kgzi', 'Andrés'   , 'Morales'  , 'Rancagua', 'API'),
    ('cvega'     , '$2a$12$c6UYOJHMPho5zVNCyiNCZueW0RrEPUZPM3.z2OrHxKJfTCz35j3Bi', 'Camila'   , 'Vega'     , 'Talca'   , 'API'),
    ('dfuentes'  , '$2a$12$CUDxc8GxeEj3rdljEYNex.mu6r.7v7inAgZxFNU/ZRDSUCue21tCa', 'Diego'    , 'Fuentes'  , 'Talca'   , 'API'),
    ('vrojas'    , '$2a$12$alH8LBgRuMzKX54H.B7Uo.hX5QyarbYGuarulN50iwFMXhMcAsJnG', 'Valentina', 'Rojas'    , 'Talca'   , 'API'),
    ('glagos'    , '$2a$12$Kq0xQvrzKn0cl3EMMsuvbey9JW5P5ry5Rchp3u5nHQJfyIban.Itm', 'Gabriel'  , 'Lagos'    , 'Temuco'  , 'API'),
    ('fmella'    , '$2a$12$rrNXupMh8TDDpEGa9rVWO.XhxUoQMRbhBmAp5ddRwDJL7q1glf0fe', 'Fernanda' , 'Mella'    , 'Temuco'  , 'API'),
    ('tsalazar'  , '$2a$12$f3uPCxtvqrNDrciahzVxquzVFCRpFcazzG4yl4/5XMnUQJ3F9dGIm', 'Tomás'    , 'Salazar'  , 'Temuco'  , 'API');


-- estaciones metereologicas
INSERT INTO smartbee.estacion(id, descripcion, latitud, longitud, dueno) VALUES
    ('EST-MGON', 'Estación Meteorológica', -36.60091567269834 , -72.10640197400267, 'mgonzalez'),
    ('EST-MHEN', 'Estación Meteorológica', -36.60091567269834 , -72.10640197400267, 'mhenriquez'),
    ('EST-PDON', 'Estación Meteorológica', -36.60091567269834 , -72.10640197400267, 'pdonald'),
    ('EST-CRAM', 'Estación Meteorológica', -30.6045538004516  , -71.20477492355013, 'cramirez'),
    ('EST-JPER', 'Estación Meteorológica', -30.6045538004516  , -71.20477492355013, 'jperez'),
    ('EST-LMUN', 'Estación Meteorológica', -30.6045538004516  , -71.20477492355013, 'lmunoz'),
    ('EST-AMOR', 'Estación Meteorológica', -34.17176208360341 , -70.73633034508013, 'amorales'),
    ('EST-JRIV', 'Estación Meteorológica', -34.17176208360341 , -70.73633034508013, 'jrivas'),
    ('EST-STOR', 'Estación Meteorológica', -34.17176208360341 , -70.73633034508013, 'storres'),
    ('EST-CVEG', 'Estación Meteorológica', -35.4286303641596  , -71.67289223259083, 'cvega'),
    ('EST-DFUE', 'Estación Meteorológica', -35.4286303641596  , -71.67289223259083, 'dfuentes'),
    ('EST-VROJ', 'Estación Meteorológica', -35.4286303641596  , -71.67289223259083, 'vrojas'),
    ('EST-FMEL', 'Estación Meteorológica', -38.731486950701765, -72.60400253667288, 'fmella'),
    ('EST-GLAG', 'Estación Meteorológica', -38.731486950701765, -72.60400253667288, 'glagos'),
    ('EST-TSAL', 'Estación Meteorológica', -38.731486950701765, -72.60400253667288, 'tsalazar');

INSERT INTO smartbee.nodo_estacion(estacion_id, nodo_id) VALUES
    ('EST-MGON', 'NODO-B5B3ABC4-E0CE-4662-ACB3-7A631C12394A'),
    ('EST-MHEN', 'NODO-38999D61-E214-4870-8352-2E0C2BD603DC'),
    ('EST-PDON', 'NODO-D0DAF85F-4F13-4FE9-9406-A3B3ECF5AAF8'),
    ('EST-CRAM', 'NODO-F3DA8F38-855F-41D3-81EC-DD4F7ADC63A0'),
    ('EST-JPER', 'NODO-7BB729C8-85A2-47CA-B28F-1B617E48E74C'),
    ('EST-LMUN', 'NODO-66B56F7E-243C-4B96-85C7-EFB00F6F76C9'),
    ('EST-AMOR', 'NODO-E909058D-9C70-4B9D-96B4-51F0ADE87B73'),
    ('EST-JRIV', 'NODO-7D3B61D6-8B71-48EC-96F5-CDDFCD19A0A6'),
    ('EST-STOR', 'NODO-1A5CDC8C-1B9C-4ABF-9695-F84A210A7471'),
    ('EST-CVEG', 'NODO-69947EA3-C824-41E1-AB7E-7E966CED2492'),
    ('EST-DFUE', 'NODO-F05C0FB6-1973-48E7-8AD8-06786D434402'),
    ('EST-VROJ', 'NODO-12155B9B-0672-4E68-8133-33893090A96A'),
    ('EST-FMEL', 'NODO-8CF65C52-FACE-42A3-B6D8-87DD82AEDA56'),
    ('EST-GLAG', 'NODO-DF38B47D-402B-4EBB-95D7-E0B38335607D'),
    ('EST-TSAL', 'NODO-10B8AA62-6F39-4C50-AADD-2414A0BCFD62');


-- colmenas
INSERT INTO smartbee.colmena(id, descripcion, latitud, longitud, dueno) VALUES
    ('COL-MGON', 'Colmena', -36.60091567269834 , -72.10640197400267, 'mgonzalez'),
    ('COL-MHEN', 'Colmena', -36.60091567269834 , -72.10640197400267, 'mhenriquez'),
    ('COL-PDON', 'Colmena', -36.60091567269834 , -72.10640197400267, 'pdonald'),
    ('COL-CRAM', 'Colmena', -30.6045538004516  , -71.20477492355013, 'cramirez'),
    ('COL-JPER', 'Colmena', -30.6045538004516  , -71.20477492355013, 'jperez'),
    ('COL-LMUN', 'Colmena', -30.6045538004516  , -71.20477492355013, 'lmunoz'),
    ('COL-AMOR', 'Colmena', -34.17176208360341 , -70.73633034508013, 'amorales'),
    ('COL-JRIV', 'Colmena', -34.17176208360341 , -70.73633034508013, 'jrivas'),
    ('COL-STOR', 'Colmena', -34.17176208360341 , -70.73633034508013, 'storres'),
    ('COL-CVEG', 'Colmena', -35.4286303641596  , -71.67289223259083, 'cvega'),
    ('COL-DFUE', 'Colmena', -35.4286303641596  , -71.67289223259083, 'dfuentes'),
    ('COL-VROJ', 'Colmena', -35.4286303641596  , -71.67289223259083, 'vrojas'),
    ('COL-FMEL', 'Colmena', -38.731486950701765, -72.60400253667288, 'fmella'),
    ('COL-GLAG', 'Colmena', -38.731486950701765, -72.60400253667288, 'glagos'),
    ('COL-TSAL', 'Colmena', -38.731486950701765, -72.60400253667288, 'tsalazar');

INSERT INTO smartbee.nodo_colmena(colmena_id, nodo_id) VALUES
    ('COL-MGON', 'NODO-BEF8C985-0FF3-4874-935B-40AA8A235FF7'),
    ('COL-MHEN', 'NODO-7881883A-97A5-47E0-869C-753E99E1B168'),
    ('COL-PDON', 'NODO-D0FC275B-C00B-41CA-89A0-B74670B8D1A4'),
    ('COL-CRAM', 'NODO-CF2B7AF0-91A1-4109-BB95-2EDA5573EE85'),
    ('COL-JPER', 'NODO-6AAB0838-6C77-43CD-9E1B-CCCAD5A8EEF9'),
    ('COL-LMUN', 'NODO-E6B60F8B-22CB-4B77-976F-B0C8403521CC'),
    ('COL-AMOR', 'NODO-6FD1F27E-E80D-4723-B3FB-3D42204A0DD2'),
    ('COL-JRIV', 'NODO-C5926599-51D6-4D72-8AA7-3209013191D0'),
    ('COL-STOR', 'NODO-F8BC905E-58FD-45BD-9A17-19FEF3150FF7'),
    ('COL-CVEG', 'NODO-915A7374-0240-4AF5-A47A-5A93EED049D7'),
    ('COL-DFUE', 'NODO-DA383110-9558-4521-9518-C5C89C6FD98F'),
    ('COL-VROJ', 'NODO-98D19A53-A372-4516-8E4D-D44CAC46A7D3'),
    ('COL-FMEL', 'NODO-C8C80453-1D45-4CE8-9B5A-EB59E5349F16'),
    ('COL-GLAG', 'NODO-3E3ABA4B-AF98-46F9-A4EA-EF136E073172'),
    ('COL-TSAL', 'NODO-C3BB9768-A6C5-40A2-B0FF-A1F6C78355C4');