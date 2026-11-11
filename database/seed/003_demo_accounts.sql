-- Synthetic demo accounts. Change these passwords before any deployment.
-- Admin: admin@ledger.example / Admin@12345
-- Researcher: ananya@example.com / Researcher@123
INSERT INTO APP_USER (email,password_hash,role,researcher_id,display_name) VALUES
('admin@ledger.example','$2b$12$g85bRKGrzC/QGNNcIwsBvOs0DqDsaC3dR/lMRIyyTKNWJA8PtWlPK','ADMIN',NULL,'Platform Admin');

INSERT INTO APP_USER (email,password_hash,role,researcher_id,display_name)
SELECT r.email,'$2b$12$zMj1LwVXedejUiZePU6O5.e4qre0XTn2q7YCqFzJbn4e1DbqxHdhi',
       'RESEARCHER',r.researcher_id,r.name
FROM RESEARCHER r ORDER BY r.researcher_id;
