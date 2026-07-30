"""Function, running after app init."""

# -- importing modules
from core.core import create_admin_flower, init_game

def main():
    create_admin_flower()
    init_game()

if __name__ == '__main__':
    main()
