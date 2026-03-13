export type SupportedCurrency = "USD" | "AED" | "GBP" | "INR" | "EUR";

export interface Country {
  code: string;
  name: string;
  currency: SupportedCurrency;
  flag: string;
}

const EUR_ZONE = new Set([
  "AD","AT","BE","CY","EE","FI","FR","DE","GR","IE","IT","LV","LT","LU",
  "MT","MC","ME","NL","PT","SM","SK","SI","ES","VA","HR","BG","CZ","DK",
  "HU","PL","RO","SE",
]);

function c(code: string, name: string, currency?: SupportedCurrency, flag?: string): Country {
  const cur: SupportedCurrency =
    currency ??
    (code === "AE" ? "AED"
      : code === "GB" || code === "GG" || code === "JE" || code === "IM" ? "GBP"
      : code === "IN" ? "INR"
      : EUR_ZONE.has(code) ? "EUR"
      : "USD");
  const f = flag ?? emojiFlag(code);
  return { code, name, currency: cur, flag: f };
}

function emojiFlag(code: string): string {
  return code.toUpperCase().replace(/./g, (ch) =>
    String.fromCodePoint(0x1F1E6 + ch.charCodeAt(0) - 65)
  );
}

export const COUNTRIES: Country[] = [
  c("AF","Afghanistan"), c("AL","Albania"), c("DZ","Algeria"), c("AD","Andorra"),
  c("AO","Angola"), c("AG","Antigua and Barbuda"), c("AR","Argentina"),
  c("AM","Armenia"), c("AU","Australia","USD"), c("AT","Austria"),
  c("AZ","Azerbaijan"), c("BS","Bahamas"), c("BH","Bahrain"),
  c("BD","Bangladesh"), c("BB","Barbados"), c("BY","Belarus"),
  c("BE","Belgium"), c("BZ","Belize"), c("BJ","Benin"),
  c("BT","Bhutan"), c("BO","Bolivia"), c("BA","Bosnia and Herzegovina"),
  c("BW","Botswana"), c("BR","Brazil"), c("BN","Brunei"),
  c("BG","Bulgaria"), c("BF","Burkina Faso"), c("BI","Burundi"),
  c("CV","Cabo Verde"), c("KH","Cambodia"), c("CM","Cameroon"),
  c("CA","Canada","USD"), c("CF","Central African Republic"),
  c("TD","Chad"), c("CL","Chile"), c("CN","China"),
  c("CO","Colombia"), c("KM","Comoros"), c("CG","Congo"),
  c("CR","Costa Rica"), c("HR","Croatia"), c("CU","Cuba"),
  c("CY","Cyprus"), c("CZ","Czech Republic"), c("DK","Denmark"),
  c("DJ","Djibouti"), c("DM","Dominica"), c("DO","Dominican Republic"),
  c("EC","Ecuador"), c("EG","Egypt"), c("SV","El Salvador"),
  c("GQ","Equatorial Guinea"), c("ER","Eritrea"), c("EE","Estonia"),
  c("SZ","Eswatini"), c("ET","Ethiopia"), c("FJ","Fiji"),
  c("FI","Finland"), c("FR","France"), c("GA","Gabon"),
  c("GM","Gambia"), c("GE","Georgia"), c("DE","Germany"),
  c("GH","Ghana"), c("GR","Greece"), c("GD","Grenada"),
  c("GT","Guatemala"), c("GN","Guinea"), c("GW","Guinea-Bissau"),
  c("GY","Guyana"), c("HT","Haiti"), c("HN","Honduras"),
  c("HU","Hungary"), c("IS","Iceland"), c("IN","India"),
  c("ID","Indonesia"), c("IR","Iran"), c("IQ","Iraq"),
  c("IE","Ireland"), c("IL","Israel"), c("IT","Italy"),
  c("JM","Jamaica"), c("JP","Japan"), c("JO","Jordan"),
  c("KZ","Kazakhstan"), c("KE","Kenya"), c("KI","Kiribati"),
  c("KW","Kuwait"), c("KG","Kyrgyzstan"), c("LA","Laos"),
  c("LV","Latvia"), c("LB","Lebanon"), c("LS","Lesotho"),
  c("LR","Liberia"), c("LY","Libya"), c("LI","Liechtenstein"),
  c("LT","Lithuania"), c("LU","Luxembourg"), c("MG","Madagascar"),
  c("MW","Malawi"), c("MY","Malaysia"), c("MV","Maldives"),
  c("ML","Mali"), c("MT","Malta"), c("MH","Marshall Islands"),
  c("MR","Mauritania"), c("MU","Mauritius"), c("MX","Mexico"),
  c("FM","Micronesia"), c("MD","Moldova"), c("MC","Monaco"),
  c("MN","Mongolia"), c("ME","Montenegro"), c("MA","Morocco"),
  c("MZ","Mozambique"), c("MM","Myanmar"), c("NA","Namibia"),
  c("NR","Nauru"), c("NP","Nepal"), c("NL","Netherlands"),
  c("NZ","New Zealand"), c("NI","Nicaragua"), c("NE","Niger"),
  c("NG","Nigeria"), c("MK","North Macedonia"), c("NO","Norway"),
  c("OM","Oman"), c("PK","Pakistan"), c("PW","Palau"),
  c("PA","Panama"), c("PG","Papua New Guinea"), c("PY","Paraguay"),
  c("PE","Peru"), c("PH","Philippines"), c("PL","Poland"),
  c("PT","Portugal"), c("QA","Qatar"), c("RO","Romania"),
  c("RU","Russia"), c("RW","Rwanda"), c("KN","Saint Kitts and Nevis"),
  c("LC","Saint Lucia"), c("VC","Saint Vincent and the Grenadines"),
  c("WS","Samoa"), c("SM","San Marino"), c("ST","Sao Tome and Principe"),
  c("SA","Saudi Arabia"), c("SN","Senegal"), c("RS","Serbia"),
  c("SC","Seychelles"), c("SL","Sierra Leone"), c("SG","Singapore"),
  c("SK","Slovakia"), c("SI","Slovenia"), c("SB","Solomon Islands"),
  c("SO","Somalia"), c("ZA","South Africa"), c("SS","South Sudan"),
  c("ES","Spain"), c("LK","Sri Lanka"), c("SD","Sudan"),
  c("SR","Suriname"), c("SE","Sweden"), c("CH","Switzerland"),
  c("SY","Syria"), c("TW","Taiwan"), c("TJ","Tajikistan"),
  c("TZ","Tanzania"), c("TH","Thailand"), c("TL","Timor-Leste"),
  c("TG","Togo"), c("TO","Tonga"), c("TT","Trinidad and Tobago"),
  c("TN","Tunisia"), c("TR","Turkey"), c("TM","Turkmenistan"),
  c("TV","Tuvalu"), c("UG","Uganda"), c("UA","Ukraine"),
  c("AE","United Arab Emirates","AED"), c("GB","United Kingdom","GBP"),
  c("US","United States","USD"), c("UY","Uruguay"),
  c("UZ","Uzbekistan"), c("VU","Vanuatu"), c("VE","Venezuela"),
  c("VN","Vietnam"), c("YE","Yemen"), c("ZM","Zambia"), c("ZW","Zimbabwe"),
].sort((a, b) => a.name.localeCompare(b.name));

export const COUNTRY_BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export function getMarketLabel(country: Country): string {
  return `${country.name} (${country.currency})`;
}

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  USD: "$",
  AED: "AED",
  GBP: "£",
  INR: "₹",
  EUR: "€",
};
