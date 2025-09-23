import React, { Component } from "react";

const COUNTRIES = [
  {
    code: "AF",
    name: "Afghanistan",
    dial: "+93",
    flag: "https://flagcdn.com/w20/af.png",
    minLength: 9,
    maxLength: 9,
  },
  {
    code: "AL",
    name: "Albania",
    dial: "+355",
    flag: "https://flagcdn.com/w20/al.png",
    minLength: 8,
    maxLength: 9,
  },
  {
    code: "DZ",
    name: "Algeria",
    dial: "+213",
    flag: "https://flagcdn.com/w20/dz.png",
    minLength: 9,
    maxLength: 9,
  },
  {
    code: "AR",
    name: "Argentina",
    dial: "+54",
    flag: "https://flagcdn.com/w20/ar.png",
    minLength: 10,
    maxLength: 10,
  },
  {
    code: "AU",
    name: "Australia",
    dial: "+61",
    flag: "https://flagcdn.com/w20/au.png",
    minLength: 9,
    maxLength: 9,
  },
  {
    code: "CA",
    name: "Canada",
    dial: "+1",
    flag: "https://flagcdn.com/w20/ca.png",
    minLength: 10,
    maxLength: 10,
  },
  {
    code: "GB",
    name: "United Kingdom",
    dial: "+44",
    flag: "https://flagcdn.com/w20/gb.png",
    minLength: 10,
    maxLength: 10,
  },
  {
    code: "IN",
    name: "India",
    dial: "+91",
    flag: "https://flagcdn.com/w20/in.png",
    minLength: 10,
    maxLength: 10,
  },
  {
    code: "JP",
    name: "Japan",
    dial: "+81",
    flag: "https://flagcdn.com/w20/jp.png",
    minLength: 10,
    maxLength: 11,
  },
  {
    code: "US",
    name: "United States",
    dial: "+1",
    flag: "https://flagcdn.com/w20/us.png",
    minLength: 10,
    maxLength: 10,
  },
];

const STRICT_RULES = {
  IN: (digits) => /^([6-9])[0-9]{9}$/.test(digits),
  US: (digits) => /^(?:[2-9][0-9]{2})(?:[2-9][0-9]{2})([0-9]{4})$/.test(digits),
};

export function formatLocalNumber(digits, countryCode) {
  if (!digits) return "";
  switch (countryCode) {
    case "US":
      return digits
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d{3})(\d{0,4})/, (_, a, b, c) =>
          c ? `(${a}) ${b}-${c}` : `(${a}) ${b}`
        );
    case "IN":
      return digits
        .replace(/\D/g, "")
        .replace(/(\d{5})(\d{0,5})/, (_, a, b) => (b ? `${a}-${b}` : a));
    case "GB":
      return digits
        .replace(/\D/g, "")
        .replace(/(\d{5})(\d{0,6})/, (_, a, b) => (b ? `${a} ${b}` : a));
    default:
      return digits;
  }
}

class PhoneInputDropdown extends Component {
  constructor(props) {
    super(props);
    const allowed = this.getCountriesByCodes(props.allowedCountries || []);
    this.state = {
      countries: allowed,
      selectedCountry: allowed[0],
      phone: "",
      showDropdown: false,
      error: "",
    };
  }

  getCountriesByCodes(codes = []) {
    if (!codes.length) return COUNTRIES;
    return COUNTRIES.filter((c) => codes.includes(c.code));
  }

  validatePhone(digits, country) {
    if (!digits) return { isValid: false, error: "Phone number required" };
    if (
      digits.length < country.minLength ||
      digits.length > country.maxLength
    ) {
      return {
        isValid: false,
        error: `Must be ${country.minLength}-${country.maxLength} digits`,
      };
    }
    const strictRule = STRICT_RULES[country.code];
    if (strictRule && !strictRule(digits)) {
      return { isValid: false, error: "Invalid format for region" };
    }
    return { isValid: true, error: "" };
  }

  toggleDropdown = () => {
    this.setState({ showDropdown: !this.state.showDropdown });
  };

  handleCountrySelect = (country) => {
    this.setState({
      selectedCountry: country,
      showDropdown: false,
      phone: "",
      error: "",
    });
  };

  handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    const { selectedCountry } = this.state;
    if (selectedCountry.maxLength) {
      value = value.slice(0, selectedCountry.maxLength);
    }
    const { isValid, error } = this.validatePhone(value, selectedCountry);
    const formatted = formatLocalNumber(value, selectedCountry.code);
    this.setState({ phone: formatted, error: isValid ? "" : error });
  };

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.selectedCountry !== this.state.selectedCountry ||
      prevState.phone !== this.state.phone ||
      prevState.error !== this.state.error
    ) {
      this.triggerChange();
    }
  }

  triggerChange = () => {
    const { phone, selectedCountry, error } = this.state;
    if (this.props.onChange) {
      this.props.onChange({
        phone: phone ? `${selectedCountry.dial}${phone}` : "",
        country: selectedCountry,
        error,
      });
    }
  };

  render() {
    const { countries, selectedCountry, phone, showDropdown, error } =
      this.state;
    const { className = "" } = this.props;

    return (
      <div className={`relative w-full ${className}`}>
        {/* Input + Dropdown unified */}
        <div className="flex items-center border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-100 focus-within:ring-2 focus-within:ring-indigo-500">
          {/* Dropdown Button */}
          <div
            className="flex items-center gap-2 px-3 cursor-pointer hover:bg-gray-700 rounded-l-lg"
            onClick={this.toggleDropdown}
            role="button"
          >
            <img
              src={selectedCountry.flag}
              alt={selectedCountry.code}
              className="w-5 h-4 rounded-sm"
            />
            <span className="text-sm">{selectedCountry.dial}</span>
            <span className="ml-0">▾</span>
          </div>

          {/* Input (same styles, seamless merge) */}
          <input
            type="tel"
            className="w-full px-3 py-2 bg-gray-700 text-white focus:outline-none rounded-r-lg"
            placeholder="Enter phone number"
            value={formatLocalNumber(phone, selectedCountry.code)}
            onChange={this.handlePhoneChange}
          />
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-700 bg-gray-900 shadow-lg">
            {countries.map((c) => (
              <li
                key={c.code}
                onClick={() => this.handleCountrySelect(c)}
                className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-800"
              >
                <img
                  src={c.flag}
                  alt={c.code}
                  className="w-5 h-4 mr-2 rounded-sm"
                />
                <span className="flex-1 text-sm">{c.name}</span>
                <span className="text-sm text-gray-400">{c.dial}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Error */}
        {error && <div className="mt-1 text-sm text-red-400">{error}</div>}
      </div>
    );
  }
}

export default PhoneInputDropdown;