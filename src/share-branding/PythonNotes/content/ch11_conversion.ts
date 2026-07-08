import { Chapter } from '../types';

export const chapter11: Chapter = {
  id: 'type-conversion',
  title: '11. Type Conversion (Casting)',
  sections: [
    {
      type: 'paragraph',
      content: `Because Python is strongly typed, it does not perform implicit type coercion (like JavaScript does) when combining mismatched types. If you attempt to add an integer and a string, Python will throw a <code>TypeError</code> rather than attempting to guess your intention. You must perform explicit Type Conversion.`
    },
    {
      type: 'heading2',
      content: 'Explicit Type Casting'
    },
    {
      type: 'paragraph',
      content: `Type casting in Python is achieved by calling the constructor function of the target data type (e.g., <code>int()</code>, <code>float()</code>, <code>str()</code>, <code>list()</code>).`
    },
    {
      type: 'code',
      language: 'python',
      content: `# Safe explicit casting
age_str = "25"
age_int = int(age_str)

print(age_int + 5) # 30`,
    },
    {
      type: 'warning-box',
      title: 'Data Loss During Casting',
      content: `Be extremely careful when casting floats to integers. <code>int(3.99)</code> does not round up to 4; it simply truncates the decimal and evaluates to 3. If you need rounding, use the <code>round()</code> or <code>math.ceil()</code> functions.`
    },
    {
      type: 'heading2',
      content: 'Truthiness and Boolean Conversion'
    },
    {
      type: 'paragraph',
      content: `When a non-boolean object is evaluated in an <code>if</code> statement, Python automatically calls the <code>bool()</code> constructor on it. Understanding "Truthiness" is a core Pythonic skill.`
    },
    {
      type: 'info-box',
      title: 'Falsy Values in Python',
      content: `The following values evaluate to <code>False</code>:<br/>
<ul>
<li><code>None</code></li>
<li><code>False</code></li>
<li>Zero of any numeric type: <code>0</code>, <code>0.0</code>, <code>0j</code></li>
<li>Empty sequences and collections: <code>''</code>, <code>()</code>, <code>[]</code>, <code>{}</code>, <code>set()</code></li>
</ul>
All other values evaluate to <code>True</code>.`
    },
    {
      type: 'best-practice',
      content: `Do not do explicit boolean checks against lengths. Instead of <code>if len(my_list) > 0:</code>, use the Pythonic approach: <code>if my_list:</code>. It is faster and more idiomatic.`
    }
  ]
};
