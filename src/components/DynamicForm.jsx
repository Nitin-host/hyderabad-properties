import React from 'react';
import { propertyFormConfig } from '../config/propertyFormConfig';

const DynamicForm = ({ formData, onChange, errors = {} }) => {
  const { sections, styles } = propertyFormConfig;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      // Handle checkbox changes
      const newFormData = {
        ...formData,
        [name]: checked
      };
      
      // Update amenities array
      const amenities = [...(formData.amenities || [])];
      if (checked && !amenities.includes(name)) {
        amenities.push(name);
      } else if (!checked && amenities.includes(name)) {
        const index = amenities.indexOf(name);
        amenities.splice(index, 1);
      }
      newFormData.amenities = amenities;
      
      onChange(newFormData);
    } else {
      // Handle nested field names (e.g., address.street)
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        const newFormData = {
          ...formData,
          [parent]: {
            ...formData[parent],
            [child]: value
          }
        };
        onChange(newFormData);
      } else {
        // Handle regular input changes
        let processedValue = value;
        
        // Handle boolean values for select fields
        if (value === 'true') processedValue = true;
        if (value === 'false') processedValue = false;
        
        onChange({
          ...formData,
          [name]: processedValue
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
      colSpan
    } = field;

    const fieldClasses = colSpan === 2 ? `${styles.fieldContainer} ${styles.colSpan2}` : styles.fieldContainer;
    const isRequired = required ? ' *' : '';
    
    // Get field value, handling nested fields
    const getFieldValue = (fieldName) => {
      if (fieldName.includes('.')) {
        console.log('Accessing nested field:', parent, child, formData[parent]);
        const [parent, child] = fieldName.split('.');
        return formData[parent]?.[child] || '';
      }
      return formData[fieldName] || '';
    };

    switch (type) {
      case 'text':
      case 'number':
        return (
          <div key={name} className={fieldClasses}>
            <label className={styles.label}>
              {label}{isRequired}
            </label>
            <input
              type={type}
              name={name}
              value={getFieldValue(name)}
              onChange={handleInputChange}
              className={styles.input}
              placeholder={placeholder}
            />
            {errors[name] && (
              <p className={styles.error}>
                {errors[name]}
              </p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={name} className={fieldClasses}>
            <label className={styles.label}>
              {label}{isRequired}
            </label>
            <textarea
              name={name}
              value={getFieldValue(name)}
              onChange={handleInputChange}
              rows={rows || 4}
              className={styles.textarea}
              placeholder={placeholder}
            />
            {errors[name] && (
              <p className={styles.error}>
                {errors[name]}
              </p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={name} className={fieldClasses}>
            <label className={styles.label}>
              {label}{isRequired}
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
            {errors[name] && (
              <p className={styles.error}>
                {errors[name]}
              </p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={name} className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id={name}
              name={name}
              checked={formData[name] || false}
              onChange={handleInputChange}
              className={styles.checkbox}
            />
            <label htmlFor={name} className={styles.checkboxLabel}>
              {label}
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  const renderSection = (section) => {
    const { id, title, type, fields } = section;

    if (type === 'checkbox-group') {
      return (
        <div key={id} className={styles.section}>
          <h3 className={styles.sectionTitle}>{title}</h3>
          <div className={styles.checkboxGrid}>
            {fields.map(field => renderField({ ...field, type: 'checkbox' }))}
          </div>
        </div>
      );
    }

    return (
      <div key={id} className={styles.section}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <div className={styles.grid}>
          {fields.map(renderField)}
        </div>
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