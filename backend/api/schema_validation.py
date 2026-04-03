from __future__ import annotations


def _is_empty(value: object) -> bool:
    if value is None:
        return True
    if isinstance(value, str):
        return value.strip() == ''
    if isinstance(value, list):
        return len(value) == 0
    return False


def _validate_scalar(field: dict, value: object, path: str, errors: dict[str, str]) -> None:
    field_type = field.get('type')

    if field_type in ('text', 'textarea', 'date'):
        if not isinstance(value, str):
            errors[path] = 'Valore non valido.'
            return
        options = field.get('options') or []
        if options and value not in options:
            errors[path] = 'Valore non ammesso.'
    elif field_type == 'select':
        if not isinstance(value, str):
            errors[path] = 'Valore non valido.'
            return
        options = field.get('options') or []
        if options and value not in options:
            errors[path] = 'Valore non ammesso.'
    elif field_type == 'number':
        if not isinstance(value, (int, float, str)):
            errors[path] = 'Numero non valido.'
            return
        if isinstance(value, str) and value.strip() == '':
            errors[path] = 'Numero non valido.'
    elif field_type == 'checkboxes':
        if not isinstance(value, list):
            errors[path] = 'Valore non valido.'
            return
        options = field.get('options') or []
        for item in value:
            if not isinstance(item, str):
                errors[path] = 'Valore non valido.'
                return
            if options and item not in options:
                errors[path] = 'Valore non ammesso.'
                return
    elif field_type == 'boolean':
        if not isinstance(value, bool):
            errors[path] = 'Valore booleano non valido.'


def validate_params(form_schema: dict, params: dict) -> dict[str, str]:
    errors: dict[str, str] = {}
    fields = form_schema.get('fields') if isinstance(form_schema, dict) else None
    if not isinstance(fields, list):
        return errors

    for field in fields:
        if not isinstance(field, dict):
            continue
        key = field.get('key')
        if not isinstance(key, str) or not key:
            continue
        required = bool(field.get('required'))
        field_type = field.get('type')
        value = params.get(key)

        if required and _is_empty(value):
            errors[key] = 'Campo obbligatorio.'
            continue
        if _is_empty(value):
            continue

        if field_type == 'checkboxes':
            if not isinstance(value, list):
                errors[key] = 'Valore non valido.'
                continue
            _validate_scalar(field, value, key, errors)
            continue

        if field_type == 'array':
            if not isinstance(value, list):
                errors[key] = 'Valore non valido.'
                continue
            item_schema = field.get('item')
            if not isinstance(item_schema, dict):
                continue
            item_fields = item_schema.get('fields')
            if not isinstance(item_fields, list):
                continue
            for idx, item in enumerate(value):
                if not isinstance(item, dict):
                    errors[f'{key}.{idx}'] = 'Elemento non valido.'
                    continue
                for sub_field in item_fields:
                    if not isinstance(sub_field, dict):
                        continue
                    sub_key = sub_field.get('key')
                    if not isinstance(sub_key, str) or not sub_key:
                        continue
                    sub_required = bool(sub_field.get('required'))
                    sub_value = item.get(sub_key)
                    sub_path = f'{key}.{idx}.{sub_key}'
                    if sub_required and _is_empty(sub_value):
                        errors[sub_path] = 'Campo obbligatorio.'
                        continue
                    if _is_empty(sub_value):
                        continue
                    _validate_scalar(sub_field, sub_value, sub_path, errors)
            continue

        _validate_scalar(field, value, key, errors)

    return errors
