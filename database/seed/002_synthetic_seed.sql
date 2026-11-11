INSERT INTO COMPANY (company_id, name, industry, website) VALUES
  (3, 'Aurora Health Systems', 'Healthcare',     'aurorahealth.example'),
  (4, 'Quantix Retail',        'E-commerce',     'quantixretail.example'),
  (5, 'Helios Mobility',       'Transportation', 'heliosmobility.example'),
  (6, 'Orbitly Social',        'Social Media',   'orbitly.example');

INSERT INTO PROGRAM (program_id, name, scope, status, company_id) VALUES
  (103, 'Aurora Patient Portal',    'portal.aurorahealth.example/*',          'ACTIVE', 3),
  (104, 'Aurora Mobile App',        'Android and iOS patient apps',           'PAUSED', 3),
  (105, 'Quantix Storefront',       'shop.quantixretail.example/*',           'ACTIVE', 4),
  (106, 'Quantix Partner API',      'partners.quantixretail.example/api/*',   'ACTIVE', 4),
  (107, 'Helios Rider App',         'api.heliosmobility.example/*',           'ACTIVE', 5),
  (108, 'Orbitly Web',              'orbitly.example/*',                      'ACTIVE', 6),
  (109, 'Orbitly Legacy Messaging', 'msg.orbitly.example/*',                  'CLOSED', 6),
  (110, 'Nexora Console',           'console.nexoracloud.com/*',              'ACTIVE', 1);
