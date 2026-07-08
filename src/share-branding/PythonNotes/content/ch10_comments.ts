import { Chapter } from '../types';

export const chapter10: Chapter = {
  id: 'comments',
  title: '10. Comments & Docstrings',
  sections: [
    {
      type: 'paragraph',
      content: `In a FAANG-level engineering environment, code is written once but read thousands of times. Comments and documentation are not optional; they are a fundamental part of the software delivery lifecycle.`
    },
    {
      type: 'heading2',
      content: 'The Two Purposes of Documentation'
    },
    {
      type: 'info-box',
      title: 'Comments vs Docstrings',
      content: `<ul>
<li><strong>Inline Comments (<code>#</code>):</strong> Explain <em>why</em> a piece of code does what it does. They are for the developers maintaining the internal implementation.</li>
<li><strong>Docstrings (<code>""" """</code>):</strong> Explain <em>what</em> a function/class does. They are the public API documentation for developers consuming the function.</li>
</ul>`
    },
    {
      type: 'best-practice',
      content: `<strong>Do not comment the "What" or the "How".</strong> The code itself should be readable enough to explain what it is doing. Comments should solely explain the <strong>"Why"</strong> (e.g., edge cases, business logic decisions, bug workarounds).`
    },
    {
      type: 'code',
      language: 'python',
      content: `# BAD COMMENT (Explaining the 'what')
# Increment i by 1
i += 1

# GOOD COMMENT (Explaining the 'why')
# Increment i to account for the header row in the CSV file
i += 1`,
    },
    {
      type: 'heading2',
      content: 'Docstrings (PEP 257)'
    },
    {
      type: 'paragraph',
      content: `Unlike <code>#</code> comments which are ignored by the Python compiler, Docstrings are evaluated and attached to the object's <code>__doc__</code> attribute at runtime. This allows tools like Sphinx to auto-generate documentation websites directly from the source code, and IDEs to provide hover-tooltips.`
    },
    {
      type: 'code',
      language: 'python',
      content: `def fetch_user_data(user_id: int) -> dict:
    """
    Retrieves user profile data from the PostgreSQL cluster.

    Args:
        user_id (int): The UUID of the user.

    Returns:
        dict: A dictionary containing 'name', 'email', and 'status'.

    Raises:
        ConnectionError: If the database is unreachable.
    """
    pass

# Accessing the docstring at runtime
print(fetch_user_data.__doc__)`,
    }
  ]
};
