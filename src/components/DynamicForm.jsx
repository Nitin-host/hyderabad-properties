import React from 'react';
import { propertyFormConfig, formHelpers } from '../config/propertyFormConfig';
import CustomDatePicker from '../util/CustomDatePicker';

const DynamicForm = ({ formData, onChange, errors = {} }) => {
  const { sections, styles } = propertyFormConfig;
console.log("Rendering DynamicForm with data:", formData);
  const handleInputChange = (e, section) => {
    const { name, value, type, checked } = e.target;

   if (type === "checkbox") {
     const key = section || name; // use section as key, fallback to field name
     const updatedArray = [...(formData[key] || [])];

     if (checked && !updatedArray.includes(name)) updatedArray.push(name);
     else if (!checked && updatedArray.includes(name)) {
       updatedArray.splice(updatedArray.indexOf(name), 1);
     }

     onChange({ ...formData, [key]: updatedArray });
     console.log("Checkbox updated:", key, updatedArray);
     return;
   } else if (type === "radio-date") {
     onChange({
       ...formData,
       [name]: value,
     });
   } else {
     // Handle nested field names (e.g., address.street)
     if (name.includes(".")) {
       const [parent, child] = name.split(".");
       const newFormData = {
         ...formData,
         [parent]: {
           ...formData[parent],
           [child]: value,
         },
       };
       onChange(newFormData);
     } else {
       let processedValue = value;
       if (value === "true") processedValue = true;
       if (value === "false") processedValue = false;

       onChange({
         ...formData,
         [name]: processedValue,
       });
     }
   }
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

    const fieldClasses = colSpan === 2 ? `${styles.fieldContainer} ${styles.colSpan2}` : styles.fieldContainer;
    const isRequired = required ? ' *' : '';
    
    // Get field value, handling nested fields
    const getFieldValue = (fieldName) => {
      if (fieldName.includes('.')) {
        const [parent, child] = fieldName.split('.');
        return formData[parent]?.[child] || '';
      }
      return formData[fieldName] || '';
    };

    switch (type) {
      case "text":
      case "number":
        return (
          <div key={name} className={fieldClasses}>
            <label className={styles.label}>
              {label}
              {isRequired}
            </label>
            <input
              type={type}
              name={name}
              value={getFieldValue(name)}
              onChange={handleInputChange}
              className={styles.input}
              placeholder={placeholder}
            />
            {errors[name] && <p className={styles.error}>{errors[name]}</p>}
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
            {errors[name] && <p className={styles.error}>{errors[name]}</p>}
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
            {errors[name] && <p className={styles.error}>{errors[name]}</p>}
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

            {/* Show calendar only if "date" is chosen */}
            {formData[name] === "date" && (
              <div className="mt-2">
                <CustomDatePicker
                  value={formData.availabilityDate || ""}
                  onChange={(date) =>
                    onChange({ ...formData, availabilityDate: date })
                  }
                  minDate={new Date()} // today onwards
                />
                {/* <input
                  type="date"
                  name="availabilityDate"
                  value={formatDateForInput(formData.availabilityDate || "")}
                  onChange={handleInputChange}
                  className={styles.input}
                  min={new Date().toISOString().split("T")[0]} // today onwards
                /> */}
              </div>
            )}
            {errors[name] && <p className={styles.error}>{errors[name]}</p>}
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

  return (
    <div className={styles.container}>
      {sections.map(renderSection)}
    </div>
  );
};

export default DynamicForm;