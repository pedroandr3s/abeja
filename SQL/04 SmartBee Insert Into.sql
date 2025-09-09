INSERT INTO smartbee.rol (rol,descripcion) VALUES
     ('ADM', 'Administrador'),
     ('API', 'Apicultor');

INSERT INTO smartbee.nodo_tipo (tipo,descripcion) VALUES
     ('AMBIENTAL', 'Nodo que mide humedad y temperatura ambiental'),
     ('COLMENA'  , 'Nodo que mide humedad, temperatura y peso de colmena');

INSERT INTO smartbee.alerta (id,nombre,indicador,descripcion) VALUES
     ('ALERT001', 'Temperatura Alta Critica'                        ,'Temperatura Interna'          ,'Temperatura  mayor a 38° en 8 eventos durante las últimas 24 horas'),
     ('ALERT002', 'Temperatura Alta Preventiva'                     ,'Temperatura Interna'          ,'Temperatura  entre 36° y 37° en 8 eventos durante las últimas 24 horas'),
     ('ALERT003', 'Temperatura Baja Crítica Período de Invernada'   ,'Temperatura Interna'          ,'Temperatura  menor que 12° en 8 eventos durante las últimas 24 horas'),
     ('ALERT004', 'Temperatura Baja Preventiva Período de Invernada','Temperatura Interna'          ,'Temperatura  entre 13° y 15° en 8 eventos durante las últimas 24 horas'),
     ('ALERT005', 'Temperatura Alta'                                ,'Temperatura Externa'          ,'Temperatura  mayor a 34° en 8 eventos durante las últimas 24 horas'),
     ('ALERT006', 'Temperatura Baja'                                ,'Temperatura Externa'          ,'Temperatura  menor a 12° en 8 eventos durante las últimas 24 horas'),
     ('ALERT007', 'Humedad Alta Crítica Período Invernada'          ,'Humedad Interna'              ,'Humedad mayor a 70% en período marzo a julio'),
     ('ALERT008', 'Humedad Alta Preventiva Período Invernada'       ,'Humedad Interna'              ,'Humedad mayor a 60% en período marzo a julio'),
     ('ALERT009', 'Humedad Baja Crítica Promavera Verano'           ,'Humedad Interna'              ,'Humedad menor a 40% en agosto a abril'),
     ('ALERT010', 'Humedad Baja Preventiva Promavera Verano'        ,'Humedad Interna'              ,'Humedad menor a 50% en período agosto a abril'),
     ('ALERT011', 'Alerta de Enjambre'                              ,'Peso'                         ,'Disminución de 500gr en dos mediciones consecutivas períodod agosto a diciembre'),
     ('ALERT012', 'Incremento de Peso Cosecha'                      ,'Peso'                         ,'Aumento de más de 20Kg en 20 días de medición continua'),
     ('ALERT013', 'Disminución de Peso Período Invernada'           ,'Peso'                         ,'Disminución de 3Kg durante un mes de medición período marzo a agosto'),
     ('ALERT014', 'Disminución Abrupta de Peso'                     ,'Peso'                         ,'Revisar'),
     ('ALERT015', 'Temperatura Anormal en Colmena'                  ,'Temperatura Interna y Externa','Diferencia de temperatura externa e Interna está entre 0° y 2° por 6 horas seguidas'),
     ('ALERT016', 'Humedad Anormal en Colmena'                      ,'Temperatura Interna y Externa','Diferencia de humedd externa e Interna está entre 0 y 2 puntos por 6 horas seguidas');

INSERT INTO smartbee.nodo (id,descripcion,tipo) VALUES
    ('NODO-B5B3ABC4-E0CE-4662-ACB3-7A631C12394A', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22'                    , 'AMBIENTAL'),
    ('NODO-38999D61-E214-4870-8352-2E0C2BD603DC', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22'                    , 'AMBIENTAL'),
    ('NODO-D0DAF85F-4F13-4FE9-9406-A3B3ECF5AAF8', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22'                    , 'AMBIENTAL'),
    ('NODO-BEF8C985-0FF3-4874-935B-40AA8A235FF7', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22 y 1 sensor de carga', 'COLMENA'),
    ('NODO-7881883A-97A5-47E0-869C-753E99E1B168', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22 y 1 sensor de carga', 'COLMENA'),
    ('NODO-D0FC275B-C00B-41CA-89A0-B74670B8D1A4', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22 y 1 sensor de carga', 'COLMENA'),
    ('NODO-F3DA8F38-855F-41D3-81EC-DD4F7ADC63A0', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22'                    , 'AMBIENTAL'),
    ('NODO-7BB729C8-85A2-47CA-B28F-1B617E48E74C', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22'                    , 'AMBIENTAL'),
    ('NODO-66B56F7E-243C-4B96-85C7-EFB00F6F76C9', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22'                    , 'AMBIENTAL'),
    ('NODO-CF2B7AF0-91A1-4109-BB95-2EDA5573EE85', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22 y 1 sensor de carga', 'COLMENA'),
    ('NODO-6AAB0838-6C77-43CD-9E1B-CCCAD5A8EEF9', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22 y 1 sensor de carga', 'COLMENA'),
    ('NODO-E6B60F8B-22CB-4B77-976F-B0C8403521CC', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22 y 1 sensor de carga', 'COLMENA'),
    ('NODO-E909058D-9C70-4B9D-96B4-51F0ADE87B73', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22'                    , 'AMBIENTAL'),
    ('NODO-7D3B61D6-8B71-48EC-96F5-CDDFCD19A0A6', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22'                    , 'AMBIENTAL'),
    ('NODO-1A5CDC8C-1B9C-4ABF-9695-F84A210A7471', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22'                    , 'AMBIENTAL'),
    ('NODO-6FD1F27E-E80D-4723-B3FB-3D42204A0DD2', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22 y 1 sensor de carga', 'COLMENA'),
    ('NODO-C5926599-51D6-4D72-8AA7-3209013191D0', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22 y 1 sensor de carga', 'COLMENA'),
    ('NODO-F8BC905E-58FD-45BD-9A17-19FEF3150FF7', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22 y 1 sensor de carga', 'COLMENA'),
    ('NODO-69947EA3-C824-41E1-AB7E-7E966CED2492', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22'                    , 'AMBIENTAL'),
    ('NODO-F05C0FB6-1973-48E7-8AD8-06786D434402', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22'                    , 'AMBIENTAL'),
    ('NODO-12155B9B-0672-4E68-8133-33893090A96A', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22'                    , 'AMBIENTAL'),
    ('NODO-915A7374-0240-4AF5-A47A-5A93EED049D7', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22 y 1 sensor de carga', 'COLMENA'),
    ('NODO-DA383110-9558-4521-9518-C5C89C6FD98F', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22 y 1 sensor de carga', 'COLMENA'),
    ('NODO-98D19A53-A372-4516-8E4D-D44CAC46A7D3', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22 y 1 sensor de carga', 'COLMENA'),
    ('NODO-8CF65C52-FACE-42A3-B6D8-87DD82AEDA56', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22'                    , 'AMBIENTAL'),
    ('NODO-DF38B47D-402B-4EBB-95D7-E0B38335607D', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22'                    , 'AMBIENTAL'),
    ('NODO-10B8AA62-6F39-4C50-AADD-2414A0BCFD62', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22'                    , 'AMBIENTAL'),
    ('NODO-C8C80453-1D45-4CE8-9B5A-EB59E5349F16', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22 y 1 sensor de carga', 'COLMENA'),
    ('NODO-3E3ABA4B-AF98-46F9-A4EA-EF136E073172', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22 y 1 sensor de carga', 'COLMENA'),
    ('NODO-C3BB9768-A6C5-40A2-B0FF-A1F6C78355C4', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22 y 1 sensor de carga', 'COLMENA'),
    ('NODO-B51D175B-9B00-4CBD-B4C1-2597C0258F26', 'ESP32 DEVKIT 38 pines (ESP-WROOM-32). Con 1 DHT22 - DNA'              , 'COLMENA');
