import React from "react";
import { propertyFormConfig, formHelpers } from "../config/propertyFormConfig";
import CustomDatePicker from "../util/CustomDatePicker";

const DynamicForm = ({ formData, onChange, errors = {} }) => {
  const { sections, styles } = propertyFormConfig;
  const handleInputChange = (e, section) => {
    const { name, value, type, checked } = e.target;

    // Checkbox handling
    if (type === "checkbox") {
      const key = section || name;
      const updatedArray = [...(formData[key] || [])];
      if (checked && !updatedArray.includes(name)) updatedArray.push(name);
      else if (!checked && updatedArray.includes(name)) {
        updatedArray.splice(updatedArray.indexOf(name), 1);
      }
      onChange({ ...formData, [key]: updatedArray });
      return;
    }

    // Radio-date
    if (type === "radio-date") {
      onChange({ ...formData, [name]: value });
      return;
    }

    // Nested field handling
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      onChange({
        ...formData,
        [parent]: { ...formData[parent], [child]: value },
      });
    } else {
      let processedValue =
        value === "true" ? true : value === "false" ? false : value;
      onChange({ ...formData, [name]: processedValue });
    }
  };

  const getFieldValue = (fieldName) => {
    if (fieldName.includes(".")) {
      const [parent, child] = fieldName.split(".");
      const value = formData[parent]?.[child];
      return value !== undefined && value !== null ? value : "";
    }
    const value = formData[fieldName];
    return value !== undefined && value !== null ? value : "";
  };

  const renderField = (field) => {
    const {
      name,
      type,
      label,
      required,
      placeholder,
      options,
      rows,
      colSpan,
      section,
    } = field;
    const fieldClasses =
      colSpan === 2
        ? `${styles.fieldContainer} ${styles.colSpan2}`
        : styles.fieldContainer;
    const isRequired = required ? " *" : "";
    const fieldError = errors[name];

    switch (type) {
      case "text":
        return (
          <div key={name} className={fieldClasses}>
            <label className={styles.label}>
              {label}
              {isRequired}
            </label>
            <input
              type="text"
              name={name}
              value={getFieldValue(name)}
              onChange={handleInputChange}
              className={styles.input}
              placeholder={placeholder}
            />
            {fieldError && <p className={styles.error}>{fieldError}</p>}
          </div>
        );

      case "number":
        return (
          <div key={name} className={fieldClasses}>
            <label className={styles.label}>
              {label}
              {isRequired}
            </label>
            <input
              type="text"
              name={name}
              value={
                getFieldValue(name) !== "" && getFieldValue(name) !== null
                  ? Number(getFieldValue(name)).toLocaleString()
                  : ""
              }
              placeholder={placeholder}
              className={styles.input}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\D/g, "");
                onChange({ ...formData, [name]: rawValue });
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp" || e.key === "ArrowDown")
                  e.preventDefault();
              }}
            />
            {fieldError && <p className={styles.error}>{fieldError}</p>}
          </div>
        );

      case "textarea":
        return (
          <div key={name} className={fieldClasses}>
            <label className={styles.label}>
              {label}
              {isRequired}
            </label>
            <textarea
              name={name}
              value={getFieldValue(name)}
              onChange={handleInputChange}
              rows={rows || 4}
              className={styles.textarea}
              placeholder={placeholder}
            />
            {fieldError && <p className={styles.error}>{fieldError}</p>}
          </div>
        );

      case "select":
        return (
          <div key={name} className={fieldClasses}>
            <label className={styles.label}>
              {label}
              {isRequired}
            </label>
            <select
              name={name}
              value={getFieldValue(name)}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Select {label.toLowerCase()}</option>
              {options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldError && <p className={styles.error}>{fieldError}</p>}
          </div>
        );

      case "checkbox":
        return (
          <div key={name} className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id={name}
              name={name}
              checked={(formData[section || "amenities"] || []).includes(name)}
              onChange={(e) => handleInputChange(e, section || "amenities")}
              className={styles.checkbox}
            />
            <label htmlFor={name} className={styles.checkboxLabel}>
              {label}
            </label>
          </div>
        );

      case "radio-date":
        return (
          <div key={name} className={fieldClasses}>
            <label className={styles.label}>
              {label}
              {isRequired}
            </label>
            <div className="flex gap-4 items-center">
              {options.map((option) => (
                <label key={option.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={name}
                    value={option.value}
                    checked={formData[name] === option.value}
                    onChange={handleInputChange}
                    className="text-blue-500"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            {formData[name] === "date" && (
              <div className="mt-2">
                <CustomDatePicker
                  value={formData.availabilityDate || ""}
                  onChange={(date) =>
                    onChange({ ...formData, availabilityDate: date })
                  }
                  minDate={new Date()}
                />
              </div>
            )}
            {fieldError && <p className={styles.error}>{fieldError}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  const renderSection = (section) => {
    const { id, title, type, fields } = section;

    if (type === "checkbox-group") {
      return (
        <div key={id} className={styles.section}>
          <h3 className={styles.sectionTitle}>{title}</h3>
          <div className={styles.checkboxGrid}>
            {fields.map((field) =>
              renderField({ ...field, type: "checkbox", section: id })
            )}
          </div>
        </div>
      );
    }

    return (
      <div key={id} className={styles.section}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <div className={styles.grid}>{fields.map(renderField)}</div>
      </div>
    );
  };

  return <div className={styles.container}>{sections.map(renderSection)}</div>;
};

export default DynamicForm;