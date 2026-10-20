ALTER TABLE comments ADD COLUMN ip_location TEXT NOT NULL DEFAULT '' CHECK(length(ip_location) <= 80);
