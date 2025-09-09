-- mysql -h localhost -u root -p mysql
-- generar claves seguras: https://1password.com/password-generator)
-- 
-- CAMBIAR EN PRODUCCIÓN
--

CREATE USER 'smartbee.admin'@'localhost' IDENTIFIED BY 'ithi3ung4oojePha3Eez';
GRANT ALL PRIVILEGES ON smartbee.* TO 'smartbee.admin'@'localhost';

CREATE USER 'smartbee.store'@'localhost' IDENTIFIED BY 'LIgrOX0IyzzvyTmID4we';
GRANT SELECT, INSERT ON smartbee.* TO 'smartbee.store'@'localhost';

CREATE USER 'smartbee.app'@'localhost' IDENTIFIED BY 'aeshae7JooG1Thah1oz5';
GRANT SELECT, INSERT, UPDATE, DELETE ON smartbee.* TO 'smartbee.app'@'localhost';

FLUSH PRIVILEGES;
