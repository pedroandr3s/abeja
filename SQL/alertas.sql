DELETE FROM smartbee.alerta;

INSERT INTO smartbee.alerta (id,nombre,indicador,descripcion) VALUES
     ('TI-TAC'   , 'Temperatura Alta Critica'                       , 'Temperatura Interna'          , 'Temperatura  mayor a 38° en 8 mediciones durante las últimas 24 horas'),
     ('TI-TAP'   , 'Temperatura Alta Preventiva'                    , 'Temperatura Interna'          , 'Temperatura  mayor o igual a 36° y menor o igual 38° en 8 mediciones durante las últimas 24 horas'),
     ('TI-TBC-PI', 'Temperatura Baja Crítica - Período de Invernada',  'Temperatura Interna'         , 'Temperatura  menor a 12° en 8 mediciones durante las últimas 48 horas'),
     ('TE-TA'    , 'Temperatura Alta'                               , 'Temperatura Externa'          , 'Temperatura  mayor a 34° en 8 mediciones durante las últimas 24 horas'),
     ('TE-TB'    , 'Temperatura Baja'                               , 'Temperatura Externa'          , 'Temperatura  menor a 6° en 8 mediciones durante las últimas 24 horas'),
     ('HI-HAC-PI', 'Humedad Alta Crítica - Período Invernada'       , 'Humedad Interna'              , 'Humedad mayor a 70% en 4  mediciones durante las últimas 48 horas'),
     ('HI-HAP-PI', 'Humedad Alta Preventiva - Período Invernada'    , 'Humedad Interna'              , 'Humedad  mayor a 60% y menor o igual a 70% en 4  mediciones durante las últimas 48 horas'),
     ('HI-HBC-PV', 'Humedad Baja Crítica - Primavera Verano'        , 'Humedad Interna'              , 'Humedad menor a 30% en 4  mediciones durante las últimas 48 horas'),
     ('HI-HBP-PV', 'Humedad Baja Preventiva - Primavera Verano'     , 'Humedad Interna'              , 'Humedad menor a 40% y mayor o igual a 30%en 4  mediciones durante las últimas 48 horas'),
     ('PE-E'     , 'Enjambre'                                       , 'Peso'                         , 'Disminución de 500gr en dos mediciones consecutivas'),
     ('PE-CPA'   , 'Cosecha o Postura de Alza'                      , 'Peso'                         , 'Aumento de peso progresivo en 10 días consecutivos'),
     ('PE-DP-PI' , 'Disminución de Peso - Período Invernada'        , 'Peso'                         , 'Disminución de peso progresivo en 7 días consecutivos'),
     ('TIE-TAC'  , 'Temperatura Anormal en Colmena'                 , 'Temperatura Interna y Externa', 'Diferencia de temperatura externa e Interna menor o igua a un 5% en 18 eventos seguidos'),
     ('HIE-HAC'  , 'Humedad Anormal en Colmena'                     , 'Humedad Interna y Externa'    , 'Diferencia de humedad externa e Interna menor o igua a un 5% en 18 eventos seguidos');


CREATE TABLE `alerta_sugerencia` (
  `id` varchar(12) NOT NULL,
  `sugerencia` text NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `alerta_sugerencia_alerta_FK` FOREIGN KEY (`id`) REFERENCES `alerta` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;



