import { Area } from '../types';

export interface DavaoBarangayDef {
  name: string;
  district: string;
  lat: number;
  lng: number;
  subdivision?: string;
}

export const DAVAO_CITY_BARANGAYS: DavaoBarangayDef[] = [
  // 1. Poblacion District (40 Barangays: 1-A to 40-D)
  { name: 'Barangay 1-A (Poblacion)', district: 'Poblacion District', lat: 7.0715, lng: 125.6105, subdivision: 'Claro M. Recto / San Pedro' },
  { name: 'Barangay 2-A (Poblacion)', district: 'Poblacion District', lat: 7.0725, lng: 125.6120, subdivision: 'Magallanes / Boulevard' },
  { name: 'Barangay 3-A (Poblacion)', district: 'Poblacion District', lat: 7.0735, lng: 125.6135, subdivision: 'City Hall Area' },
  { name: 'Barangay 4-A (Poblacion)', district: 'Poblacion District', lat: 7.0745, lng: 125.6145, subdivision: 'Rizal Park / Bolton' },
  { name: 'Barangay 5-A (Poblacion)', district: 'Poblacion District', lat: 7.0695, lng: 125.6080, subdivision: 'Bankerohan Public Market' },
  { name: 'Barangay 6-A (Poblacion)', district: 'Poblacion District', lat: 7.0708, lng: 125.6095, subdivision: 'Pichon / Magallanes' },
  { name: 'Barangay 7-A (Poblacion)', district: 'Poblacion District', lat: 7.0718, lng: 125.6105, subdivision: 'Quezon Boulevard' },
  { name: 'Barangay 8-A (Poblacion)', district: 'Poblacion District', lat: 7.0682, lng: 125.6070, subdivision: 'Davao Riverfront / Madapo' },
  { name: 'Barangay 9-A (Poblacion)', district: 'Poblacion District', lat: 7.0665, lng: 125.6055, subdivision: 'Sandawa / Guillermo E. Torres' },
  { name: 'Barangay 10-A (Poblacion)', district: 'Poblacion District', lat: 7.0650, lng: 125.6040, subdivision: 'Quirino Avenue' },
  { name: 'Barangay 11-B (Poblacion)', district: 'Poblacion District', lat: 7.0760, lng: 125.6160, subdivision: 'Pelayo Street' },
  { name: 'Barangay 12-B (Poblacion)', district: 'Poblacion District', lat: 7.0775, lng: 125.6175, subdivision: 'Bonifacio / Palma Gil' },
  { name: 'Barangay 13-B (Poblacion)', district: 'Poblacion District', lat: 7.0790, lng: 125.6190, subdivision: 'Inigo / Monteverde' },
  { name: 'Barangay 14-B (Poblacion)', district: 'Poblacion District', lat: 7.0805, lng: 125.6205, subdivision: 'R. Magsaysay Ave' },
  { name: 'Barangay 15-B (Poblacion)', district: 'Poblacion District', lat: 7.0818, lng: 125.6218, subdivision: 'Chinatown / Ramon Magsaysay' },
  { name: 'Barangay 16-B (Poblacion)', district: 'Poblacion District', lat: 7.0830, lng: 125.6230, subdivision: 'Suazo / Alvarez' },
  { name: 'Barangay 17-B (Poblacion)', district: 'Poblacion District', lat: 7.0842, lng: 125.6242, subdivision: 'Lapu-Lapu / Lizada' },
  { name: 'Barangay 18-B (Poblacion)', district: 'Poblacion District', lat: 7.0855, lng: 125.6255, subdivision: 'Sta. Ana Avenue' },
  { name: 'Barangay 19-B (Poblacion)', district: 'Poblacion District', lat: 7.0868, lng: 125.6268, subdivision: 'Bajada / J.P. Laurel' },
  { name: 'Barangay 20-B (Poblacion)', district: 'Poblacion District', lat: 7.0880, lng: 125.6280, subdivision: 'Obrero Commercial Zone' },
  { name: 'Barangay 21-C (Poblacion)', district: 'Poblacion District', lat: 7.0680, lng: 125.6140, subdivision: 'Piapi / Boulevard' },
  { name: 'Barangay 22-C (Poblacion)', district: 'Poblacion District', lat: 7.0670, lng: 125.6150, subdivision: 'Piapi Seaside' },
  { name: 'Barangay 23-C (Poblacion)', district: 'Poblacion District', lat: 7.0660, lng: 125.6160, subdivision: 'Mini Forest / Isla Verde' },
  { name: 'Barangay 24-C (Poblacion)', district: 'Poblacion District', lat: 7.0650, lng: 125.6170, subdivision: 'Coastal Road Sector' },
  { name: 'Barangay 25-C (Poblacion)', district: 'Poblacion District', lat: 7.0640, lng: 125.6180, subdivision: 'Trading Boulevard' },
  { name: 'Barangay 26-C (Poblacion)', district: 'Poblacion District', lat: 7.0630, lng: 125.6190, subdivision: 'Leon Garcia Zone' },
  { name: 'Barangay 27-C (Poblacion)', district: 'Poblacion District', lat: 7.0690, lng: 125.6155, subdivision: 'Salmonan / Quezon Blvd' },
  { name: 'Barangay 28-C (Poblacion)', district: 'Poblacion District', lat: 7.0700, lng: 125.6168, subdivision: 'Lizada Boulevard' },
  { name: 'Barangay 29-C (Poblacion)', district: 'Poblacion District', lat: 7.0710, lng: 125.6180, subdivision: 'Sta. Ana Coastal' },
  { name: 'Barangay 30-C (Poblacion)', district: 'Poblacion District', lat: 7.0725, lng: 125.6200, subdivision: 'Magsaysay Park Wharf' },
  { name: 'Barangay 31-D (Poblacion)', district: 'Poblacion District', lat: 7.0890, lng: 125.6285, subdivision: 'Dacudao Ave / Agdao border' },
  { name: 'Barangay 32-D (Poblacion)', district: 'Poblacion District', lat: 7.0905, lng: 125.6298, subdivision: 'Agdao Valley' },
  { name: 'Barangay 33-D (Poblacion)', district: 'Poblacion District', lat: 7.0918, lng: 125.6310, subdivision: 'Cabaguio Avenue' },
  { name: 'Barangay 34-D (Poblacion)', district: 'Poblacion District', lat: 7.0930, lng: 125.6322, subdivision: 'Wilfredo Aquino Border' },
  { name: 'Barangay 35-D (Poblacion)', district: 'Poblacion District', lat: 7.0942, lng: 125.6335, subdivision: 'Palma Gil St. Extension' },
  { name: 'Barangay 36-D (Poblacion)', district: 'Poblacion District', lat: 7.0955, lng: 125.6348, subdivision: 'Gov. Duterte Zone' },
  { name: 'Barangay 37-D (Poblacion)', district: 'Poblacion District', lat: 7.0968, lng: 125.6360, subdivision: 'Kap. Monteverde Zone' },
  { name: 'Barangay 38-D (Poblacion)', district: 'Poblacion District', lat: 7.0980, lng: 125.6372, subdivision: 'Agdao Commercial Strip' },
  { name: 'Barangay 39-D (Poblacion)', district: 'Poblacion District', lat: 7.0992, lng: 125.6385, subdivision: 'Castillo District' },
  { name: 'Barangay 40-D (Poblacion)', district: 'Poblacion District', lat: 7.1005, lng: 125.6398, subdivision: 'Agdao Creek Sector' },

  // 2. Talomo District (14 Barangays)
  { name: 'Barangay Bago Aplaya', district: 'Talomo District', lat: 7.0385, lng: 125.5420, subdivision: 'Gulf View Executive / Versoza' },
  { name: 'Barangay Bago Gallera', district: 'Talomo District', lat: 7.0550, lng: 125.5280, subdivision: 'Gallera de Oro / Rosalina 3' },
  { name: 'Barangay Baliok', district: 'Talomo District', lat: 7.0480, lng: 125.5220, subdivision: 'South Villa / Baliok Proper' },
  { name: 'Barangay Bucana (76-A)', district: 'Talomo District', lat: 7.0610, lng: 125.6040, subdivision: 'Times Beach / San Pedro Ext' },
  { name: 'Barangay Catalunan Grande', district: 'Talomo District', lat: 7.0680, lng: 125.5460, subdivision: 'Skyline Village / Ruby Subd' },
  { name: 'Barangay Catalunan Pequeño', district: 'Talomo District', lat: 7.0580, lng: 125.5520, subdivision: 'Wellspring Highlands / Residencia' },
  { name: 'Barangay Dumoy', district: 'Talomo District', lat: 7.0435, lng: 125.5380, subdivision: 'DCWD Water Source / Coca-Cola' },
  { name: 'Barangay Langub', district: 'Talomo District', lat: 7.0910, lng: 125.5780, subdivision: 'Magtuod-Langub Ridge' },
  { name: 'Barangay Ma-a', district: 'Talomo District', lat: 7.0780, lng: 125.5890, subdivision: 'Dona Pilar / Woodridge / Palmetto' },
  { name: 'Barangay Magtuod', district: 'Talomo District', lat: 7.0980, lng: 125.5670, subdivision: 'Ciudad Esperanza / Country Homes' },
  { name: 'Barangay Matina Aplaya', district: 'Talomo District', lat: 7.0535, lng: 125.5840, subdivision: 'Ecoland Phase 1-7 / Shanghai' },
  { name: 'Barangay Matina Crossing (74-A)', district: 'Talomo District', lat: 7.0650, lng: 125.5840, subdivision: 'GSIS Heights / McArthur Highway' },
  { name: 'Barangay Matina Pangi', district: 'Talomo District', lat: 7.0760, lng: 125.5710, subdivision: 'La Vista Monte / Orange Grove' },
  { name: 'Barangay Talomo Proper', district: 'Talomo District', lat: 7.0520, lng: 125.5550, subdivision: 'Punta Dumalag / Central Park' },

  // 3. Agdao District (11 Barangays)
  { name: 'Barangay Agdao Proper', district: 'Agdao District', lat: 7.0850, lng: 125.6320, subdivision: 'Agdao Public Market / Lapu-Lapu St' },
  { name: 'Barangay Centro (San Juan)', district: 'Agdao District', lat: 7.0870, lng: 125.6340, subdivision: 'San Juan Commercial' },
  { name: 'Barangay Gov. Paciano Bangoy', district: 'Agdao District', lat: 7.0830, lng: 125.6280, subdivision: 'Bangoy Homes / Cabaguio' },
  { name: 'Barangay Gov. Vicente Duterte', district: 'Agdao District', lat: 7.0890, lng: 125.6310, subdivision: 'Duterte Village' },
  { name: 'Barangay Kap. Tomas Monteverde, Sr.', district: 'Agdao District', lat: 7.0810, lng: 125.6250, subdivision: 'Monteverde Ext / Villa Abrille' },
  { name: 'Barangay Lapu-Lapu', district: 'Agdao District', lat: 7.0920, lng: 125.6360, subdivision: 'Lapu-Lapu Riverside' },
  { name: 'Barangay Leon Garcia, Sr.', district: 'Agdao District', lat: 7.0860, lng: 125.6370, subdivision: 'Leon Garcia Portside' },
  { name: 'Barangay Rafael Castillo', district: 'Agdao District', lat: 7.0940, lng: 125.6380, subdivision: 'Castillo Coastal' },
  { name: 'Barangay San Antonio', district: 'Agdao District', lat: 7.0880, lng: 125.6270, subdivision: 'San Antonio Phase 1' },
  { name: 'Barangay Santa Maria', district: 'Agdao District', lat: 7.0900, lng: 125.6290, subdivision: 'Sta. Maria Parish Zone' },
  { name: 'Barangay Ubalde', district: 'Agdao District', lat: 7.0840, lng: 125.6350, subdivision: 'Ubalde Coastal' },
  { name: 'Barangay Wilfredo Aquino', district: 'Agdao District', lat: 7.0910, lng: 125.6330, subdivision: 'R. Castillo Extension' },

  // 4. Buhangin District (13 Barangays)
  { name: 'Barangay Acacia', district: 'Buhangin District', lat: 7.1320, lng: 125.6380, subdivision: 'Acacia Estates' },
  { name: 'Barangay Alfonso Angliongto, Sr.', district: 'Buhangin District', lat: 7.1180, lng: 125.6350, subdivision: 'Mamay Road / Diamond Heights' },
  { name: 'Barangay Buhangin Proper', district: 'Buhangin District', lat: 7.1080, lng: 125.6150, subdivision: 'Ladera Homes / Panorama' },
  { name: 'Barangay Cabantian', district: 'Buhangin District', lat: 7.1260, lng: 125.6280, subdivision: 'Country Homes / Emilia Homes / Deca Homes' },
  { name: 'Barangay Callawa', district: 'Buhangin District', lat: 7.1850, lng: 125.5890, subdivision: 'Callawa Agricultural Sector' },
  { name: 'Barangay Communal', district: 'Buhangin District', lat: 7.1380, lng: 125.6320, subdivision: 'Airport View Subd / Priscilla' },
  { name: 'Barangay Indangan', district: 'Buhangin District', lat: 7.1550, lng: 125.6290, subdivision: 'Deca Homes Indangan / Hidalgo' },
  { name: 'Barangay Mandug', district: 'Buhangin District', lat: 7.1720, lng: 125.5980, subdivision: 'Ciudades / Mandug Heights' },
  { name: 'Barangay Pampanga', district: 'Buhangin District', lat: 7.1090, lng: 125.6420, subdivision: 'Belisario Heights / Fortune Homes' },
  { name: 'Barangay Sasa', district: 'Buhangin District', lat: 7.1210, lng: 125.6510, subdivision: 'Sasa Ferry Wharf / Doña Pilar' },
  { name: 'Barangay Tigatto', district: 'Buhangin District', lat: 7.1350, lng: 125.6020, subdivision: 'Deca Homes Esperanza / Jade Valley' },
  { name: 'Barangay Vicente Hizon, Sr.', district: 'Buhangin District', lat: 7.1140, lng: 125.6410, subdivision: 'Nova Tierra / Insular Village' },
  { name: 'Barangay Waan', district: 'Buhangin District', lat: 7.1520, lng: 125.5860, subdivision: 'Waan Riverfront' },

  // 5. Bunawan District (9 Barangays)
  { name: 'Barangay Alejandra Navarro (Lasang)', district: 'Bunawan District', lat: 7.2510, lng: 125.6680, subdivision: 'Lasang Boundary / Licanan' },
  { name: 'Barangay Bunawan Proper', district: 'Bunawan District', lat: 7.2280, lng: 125.6520, subdivision: 'Bunawan Port / San Miguel' },
  { name: 'Barangay Gatungan', district: 'Bunawan District', lat: 7.2150, lng: 125.6250, subdivision: 'Gatungan Valley' },
  { name: 'Barangay Ilang', district: 'Bunawan District', lat: 7.1950, lng: 125.6480, subdivision: 'Holcim Cement / Ilang Coastal' },
  { name: 'Barangay Mahayag', district: 'Bunawan District', lat: 7.2080, lng: 125.6380, subdivision: 'Mahayag Proper' },
  { name: 'Barangay Mudiang', district: 'Bunawan District', lat: 7.1820, lng: 125.6350, subdivision: 'Mudiang Industrial' },
  { name: 'Barangay Panacan', district: 'Bunawan District', lat: 7.1520, lng: 125.6490, subdivision: 'Camp Panacan / DPWH Depot' },
  { name: 'Barangay San Isidro (Licanan)', district: 'Bunawan District', lat: 7.2420, lng: 125.6580, subdivision: 'San Isidro Plains' },
  { name: 'Barangay Tibungco', district: 'Bunawan District', lat: 7.1780, lng: 125.6510, subdivision: 'Tibungco Public Market' },

  // 6. Paquibato District (13 Barangays)
  { name: 'Barangay Colosas', district: 'Paquibato District', lat: 7.3980, lng: 125.5620, subdivision: 'Colosas Highland' },
  { name: 'Barangay Fatima (Benowang)', district: 'Paquibato District', lat: 7.3650, lng: 125.5480, subdivision: 'Fatima Agro Zone' },
  { name: 'Barangay Lumiad', district: 'Paquibato District', lat: 7.4210, lng: 125.5780, subdivision: 'Lumiad Ridge' },
  { name: 'Barangay Mabuhay', district: 'Paquibato District', lat: 7.3480, lng: 125.5390, subdivision: 'Mabuhay Valley' },
  { name: 'Barangay Malabog', district: 'Paquibato District', lat: 7.3120, lng: 125.5520, subdivision: 'Malabog Commercial Center' },
  { name: 'Barangay Mapula', district: 'Paquibato District', lat: 7.4350, lng: 125.5650, subdivision: 'Mapula Forest Range' },
  { name: 'Barangay Panalum', district: 'Paquibato District', lat: 7.3820, lng: 125.5320, subdivision: 'Panalum Valley' },
  { name: 'Barangay Pandaitan', district: 'Paquibato District', lat: 7.3550, lng: 125.5720, subdivision: 'Pandaitan Sector' },
  { name: 'Barangay Paquibato Proper', district: 'Paquibato District', lat: 7.3710, lng: 125.5540, subdivision: 'Paquibato Municipal Annex' },
  { name: 'Barangay Paradise Embak', district: 'Paquibato District', lat: 7.2890, lng: 125.5380, subdivision: 'Embak Agro' },
  { name: 'Barangay Salapawan', district: 'Paquibato District', lat: 7.3320, lng: 125.5680, subdivision: 'Salapawan Hills' },
  { name: 'Barangay Sumimao', district: 'Paquibato District', lat: 7.3910, lng: 125.5450, subdivision: 'Sumimao Heights' },
  { name: 'Barangay Tapak', district: 'Paquibato District', lat: 7.4680, lng: 125.5120, subdivision: 'Tapak Mountain Reserve' },

  // 7. Baguio District (8 Barangays)
  { name: 'Barangay Baguio Proper', district: 'Baguio District', lat: 7.1950, lng: 125.4120, subdivision: 'Baguio Center' },
  { name: 'Barangay Cadalian', district: 'Baguio District', lat: 7.2150, lng: 125.4280, subdivision: 'Cadalian Agro' },
  { name: 'Barangay Carmen', district: 'Baguio District', lat: 7.2280, lng: 125.3950, subdivision: 'Carmen Baguio' },
  { name: 'Barangay Gumalang', district: 'Baguio District', lat: 7.1820, lng: 125.4350, subdivision: 'Gumalang Foothills' },
  { name: 'Barangay Malagos', district: 'Baguio District', lat: 7.1780, lng: 125.4180, subdivision: 'Malagos Watershed / Chocolate Park' },
  { name: 'Barangay Tambobong', district: 'Baguio District', lat: 7.2420, lng: 125.3820, subdivision: 'Tambobong Valley' },
  { name: 'Barangay Tawan-Tawan', district: 'Baguio District', lat: 7.2080, lng: 125.4410, subdivision: 'Tawan-Tawan Agro' },
  { name: 'Barangay Wines', district: 'Baguio District', lat: 7.2350, lng: 125.4050, subdivision: 'Wines Highland' },

  // 8. Calinan District (20 Barangays)
  { name: 'Barangay Biao Escuela', district: 'Calinan District', lat: 7.1680, lng: 125.4620, subdivision: 'Biao Escuela Proper' },
  { name: 'Barangay Biao Joaquin', district: 'Calinan District', lat: 7.1550, lng: 125.4520, subdivision: 'Biao Joaquin Agro' },
  { name: 'Barangay Calinan Proper', district: 'Calinan District', lat: 7.1850, lng: 125.4580, subdivision: 'Calinan Commercial / Market' },
  { name: 'Barangay Cawayan', district: 'Calinan District', lat: 7.2020, lng: 125.4720, subdivision: 'Cawayan Valley' },
  { name: 'Barangay Dacudao', district: 'Calinan District', lat: 7.2180, lng: 125.4850, subdivision: 'Dacudao Agro-Industrial' },
  { name: 'Barangay Dalagdag', district: 'Calinan District', lat: 7.2410, lng: 125.4980, subdivision: 'Dalagdag Hills' },
  { name: 'Barangay Dominga', district: 'Calinan District', lat: 7.2650, lng: 125.5120, subdivision: 'Dominga Highland' },
  { name: 'Barangay Inayangan', district: 'Calinan District', lat: 7.1980, lng: 125.4480, subdivision: 'Inayangan Foothills' },
  { name: 'Barangay Lacson', district: 'Calinan District', lat: 7.2120, lng: 125.4650, subdivision: 'Lacson Plantations' },
  { name: 'Barangay Lamanan', district: 'Calinan District', lat: 7.2350, lng: 125.4780, subdivision: 'Lamanan Valley' },
  { name: 'Barangay Lampianao', district: 'Calinan District', lat: 7.2520, lng: 125.4910, subdivision: 'Lampianao Foothills' },
  { name: 'Barangay Megkawayan', district: 'Calinan District', lat: 7.1750, lng: 125.4780, subdivision: 'Megkawayan Agro' },
  { name: 'Barangay Pangyan', district: 'Calinan District', lat: 7.2250, lng: 125.4550, subdivision: 'Pangyan Ridge' },
  { name: 'Barangay Riverside', district: 'Calinan District', lat: 7.1920, lng: 125.4680, subdivision: 'Riverside Davao River' },
  { name: 'Barangay Saloy', district: 'Calinan District', lat: 7.2480, lng: 125.4620, subdivision: 'Saloy Mountain Range' },
  { name: 'Barangay Sirib', district: 'Calinan District', lat: 7.1620, lng: 125.4380, subdivision: 'Sirib Agro Center' },
  { name: 'Barangay Subasta', district: 'Calinan District', lat: 7.1510, lng: 125.4450, subdivision: 'Subasta Valley' },
  { name: 'Barangay Talomo River', district: 'Calinan District', lat: 7.1720, lng: 125.4490, subdivision: 'Talomo River Bank' },
  { name: 'Barangay Tamayong', district: 'Calinan District', lat: 7.1420, lng: 125.4250, subdivision: 'Prayer Mountain / Tamayong' },
  { name: 'Barangay Wangan', district: 'Calinan District', lat: 7.1810, lng: 125.4890, subdivision: 'Wangan National High Area' },

  // 9. Marilog District (12 Barangays)
  { name: 'Barangay Baganihan', district: 'Marilog District', lat: 7.4650, lng: 125.2480, subdivision: 'Baganihan Overlook / Bukidnon Highway' },
  { name: 'Barangay Bantol', district: 'Marilog District', lat: 7.3920, lng: 125.2950, subdivision: 'Bantol Valley' },
  { name: 'Barangay Buda', district: 'Marilog District', lat: 7.5120, lng: 125.2280, subdivision: 'BuDa Mountain Resort / Pine Ridge' },
  { name: 'Barangay Dalag', district: 'Marilog District', lat: 7.4250, lng: 125.2810, subdivision: 'Dalag Agro' },
  { name: 'Barangay Datu Salumay', district: 'Marilog District', lat: 7.4850, lng: 125.2350, subdivision: 'Salumay Pass' },
  { name: 'Barangay Gumitan', district: 'Marilog District', lat: 7.5380, lng: 125.2150, subdivision: 'Gumitan Heights' },
  { name: 'Barangay Magsaysay', district: 'Marilog District', lat: 7.4410, lng: 125.2650, subdivision: 'Magsaysay Marilog' },
  { name: 'Barangay Malamba', district: 'Marilog District', lat: 7.3780, lng: 125.3120, subdivision: 'Malamba Valley' },
  { name: 'Barangay Marilog Proper', district: 'Marilog District', lat: 7.4520, lng: 125.2580, subdivision: 'Marilog Center / Health Unit' },
  { name: 'Barangay Salaysay', district: 'Marilog District', lat: 7.3550, lng: 125.3350, subdivision: 'Salaysay Agro' },
  { name: 'Barangay Suawan (Kulafu)', district: 'Marilog District', lat: 7.3250, lng: 125.3620, subdivision: 'Suawan River / Kulafu' },
  { name: 'Barangay Tamugan', district: 'Marilog District', lat: 7.2950, lng: 125.3850, subdivision: 'Tamugan Watershed / Davao Water Joint' },

  // 10. Toril District (25 Barangays)
  { name: 'Barangay Alambre', district: 'Toril District', lat: 6.9950, lng: 125.4820, subdivision: 'Alambre Agro' },
  { name: 'Barangay Atan-Awe', district: 'Toril District', lat: 6.9820, lng: 125.4720, subdivision: 'Atan-Awe Foothills' },
  { name: 'Barangay Bangkas Heights', district: 'Toril District', lat: 7.0250, lng: 125.4950, subdivision: 'Bangkas View' },
  { name: 'Barangay Baracatan', district: 'Toril District', lat: 6.9580, lng: 125.4250, subdivision: 'Mt. Apo Foot Range' },
  { name: 'Barangay Bato', district: 'Toril District', lat: 7.0080, lng: 125.4890, subdivision: 'Bato Toril' },
  { name: 'Barangay Bayabas', district: 'Toril District', lat: 7.0320, lng: 125.4820, subdivision: 'Bayabas Heights' },
  { name: 'Barangay Binugao', district: 'Toril District', lat: 6.9350, lng: 125.4520, subdivision: 'Therma South Energy / Sirawan Port' },
  { name: 'Barangay Camansi', district: 'Toril District', lat: 6.9880, lng: 125.4520, subdivision: 'Camansi Valley' },
  { name: 'Barangay Catigan', district: 'Toril District', lat: 7.0150, lng: 125.4620, subdivision: 'Catigan Highlands' },
  { name: 'Barangay Crossing Bayabas', district: 'Toril District', lat: 7.0210, lng: 125.4980, subdivision: 'Crossing Bayabas Commercial' },
  { name: 'Barangay Daliao', district: 'Toril District', lat: 7.0120, lng: 125.5080, subdivision: 'Daliao Fish Port Complex' },
  { name: 'Barangay Daliaon Plantation', district: 'Toril District', lat: 6.9920, lng: 125.4880, subdivision: 'Plantation Road' },
  { name: 'Barangay Eden', district: 'Toril District', lat: 7.0050, lng: 125.4350, subdivision: 'Eden Nature Park & Resort / Bayabas' },
  { name: 'Barangay Kilate', district: 'Toril District', lat: 7.0350, lng: 125.4820, subdivision: 'Kilate Agro' },
  { name: 'Barangay Lizada', district: 'Toril District', lat: 7.0180, lng: 125.5090, subdivision: 'Lizada Beach' },
  { name: 'Barangay Lubogan', district: 'Toril District', lat: 7.0260, lng: 125.5080, subdivision: 'Lubogan Commercial / Gaisano Grand Toril' },
  { name: 'Barangay Marapangi', district: 'Toril District', lat: 7.0020, lng: 125.4750, subdivision: 'Marapangi Valley' },
  { name: 'Barangay Mulig', district: 'Toril District', lat: 7.0420, lng: 125.4720, subdivision: 'Mulig Ridge' },
  { name: 'Barangay Sibulan', district: 'Toril District', lat: 6.9420, lng: 125.4120, subdivision: 'Sibulan Hydro Plant / Tudaya' },
  { name: 'Barangay Sirawan', district: 'Toril District', lat: 6.9620, lng: 125.4720, subdivision: 'Sirawan Coastal / Highway' },
  { name: 'Barangay Tagluno', district: 'Toril District', lat: 7.0480, lng: 125.4650, subdivision: 'Tagluno Heights' },
  { name: 'Barangay Tagurano', district: 'Toril District', lat: 6.9720, lng: 125.4420, subdivision: 'Tagurano Hills' },
  { name: 'Barangay Tibuloy', district: 'Toril District', lat: 6.9650, lng: 125.4550, subdivision: 'Tibuloy Proper' },
  { name: 'Barangay Toril Proper', district: 'Toril District', lat: 7.0195, lng: 125.5020, subdivision: 'Toril Public Market / St. Peter' },
  { name: 'Barangay Tungkalan', district: 'Toril District', lat: 7.0280, lng: 125.4480, subdivision: 'Tungkalan Agro' },

  // 11. Tugbok District (17 Barangays)
  { name: 'Barangay Angalan', district: 'Tugbok District', lat: 7.1250, lng: 125.4980, subdivision: 'Angalan Valley' },
  { name: 'Barangay Bago Oshiro', district: 'Tugbok District', lat: 7.0720, lng: 125.5220, subdivision: 'BPCI Bago Oshiro / PhilFIDA' },
  { name: 'Barangay Balengaeng', district: 'Tugbok District', lat: 7.1120, lng: 125.4850, subdivision: 'Balengaeng Valley' },
  { name: 'Barangay Biao Guianga', district: 'Tugbok District', lat: 7.1420, lng: 125.4750, subdivision: 'Biao Guianga Agro' },
  { name: 'Barangay Los Amigos', district: 'Tugbok District', lat: 7.1050, lng: 125.4920, subdivision: 'Los Amigos Public Market / UP Mindanao Area' },
  { name: 'Barangay Manambulan', district: 'Tugbok District', lat: 7.0580, lng: 125.4850, subdivision: 'Manambulan Agro Sector' },
  { name: 'Barangay Manuel Guianga', district: 'Tugbok District', lat: 7.1350, lng: 125.4650, subdivision: 'Manuel Guianga Proper' },
  { name: 'Barangay Matina Biao', district: 'Tugbok District', lat: 7.0850, lng: 125.5350, subdivision: 'Matina Biao Heights' },
  { name: 'Barangay Mintal', district: 'Tugbok District', lat: 7.0920, lng: 125.5180, subdivision: 'Little Tokyo / Mintal Public Market / UP Mindanao' },
  { name: 'Barangay New Carmen', district: 'Tugbok District', lat: 7.1180, lng: 125.5120, subdivision: 'New Carmen Valley' },
  { name: 'Barangay New Valencia', district: 'Tugbok District', lat: 7.1310, lng: 125.4890, subdivision: 'New Valencia Proper' },
  { name: 'Barangay Santo Niño', district: 'Tugbok District', lat: 7.0780, lng: 125.5050, subdivision: 'Deca Homes Resort City / Relocation' },
  { name: 'Barangay Tacunan', district: 'Tugbok District', lat: 7.0980, lng: 125.4980, subdivision: 'Deca Homes Tacunan / Green Meadows' },
  { name: 'Barangay Tagakpan', district: 'Tugbok District', lat: 7.0680, lng: 125.4750, subdivision: 'Tagakpan Agro' },
  { name: 'Barangay Talandang', district: 'Tugbok District', lat: 7.1480, lng: 125.5150, subdivision: 'Talandang Heights' },
  { name: 'Barangay Tugbok Proper', district: 'Tugbok District', lat: 7.0880, lng: 125.5020, subdivision: 'Tugbok Commercial / Highway' },
  { name: 'Barangay Ula', district: 'Tugbok District', lat: 7.1080, lng: 125.5050, subdivision: 'Ula Green Valley' }
];

export function generateAllDavaoAreas(): Area[] {
  return DAVAO_CITY_BARANGAYS.map((b, index) => {
    // Generate clean slug ID
    const cleanName = b.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return {
      id: `area-davao-${cleanName}-${index + 1}`,
      region: 'Region XI (Davao Region)',
      province: 'Davao del Sur',
      cityMunicipality: 'Davao City',
      district: b.district,
      barangay: b.name,
      subdivisionVillage: b.subdivision,
      latitude: b.lat,
      longitude: b.lng,
      supported: true,
      utilityProvider: 'Davao Light and Power Company (DLPC)',
      lguName: 'City Government of Davao',
      createdAt: '2026-01-01T00:00:00Z'
    };
  });
}
