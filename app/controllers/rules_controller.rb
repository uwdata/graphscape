class RulesController < ApplicationController

  def index
    @rules = Rule.all
    @human_answers = HumanAnswer.all_with_csv_triplets
    @specs = Spec.all
    session[:return_to] = "rules_path"
  end

  def making
    @specs = Spec.all
    @rule  = Rule.find_by_id(params[:id]) || Rule.new();
    @human_answers = HumanAnswer.all_with_csv_triplets
    session[:return_to] = "making_with_rule_path"

  end


  def create
    @rule = Rule.new(rule_params)
    @rule.user = @current_user

    if @rule.save
      flash[:success] = "Saved!"
      redirect_to edit_rule_path(@rule)
    else
      flash[:error] = 'Failed to save the rule.'
      redirect_to making_rules_path()
    end
  end

  def compare_with_human_answers

    @human_answers = HumanAnswer.all_with_csv_triplets
    @rule = Rule.find(params[:id])
    @specs = Spec.all
  end


  def edit
    @rule = Rule.find(params[:id])

    if @rule.user != current_user
      flash[:error] = "You cannot edit others' rule."
      redirect_to where_to_return(session.delete(:return_to),@rule)
    end

  end
  def update
    @rule = Rule.find(params[:id])


    if @rule.user == current_user
      if @rule.update(rule_params)
        flash[:success] = "Saved!"
        redirect_to where_to_return(session.delete(:return_to),@rule)
      else
        flash[:error] = 'Failed to update the rule.'
        redirect_to where_to_return(session.delete(:return_to),@rule)
      end
    else
      flash[:error] = "You cannot edit others' rule."
      redirect_to where_to_return(session.delete(:return_to),@rule)
    end

  end
  def update_score
    @rule = Rule.find(params[:id])
    if @rule.update(rule_params)
      render json: @rule.to_json, status: 200
    else
      render json: { message: "Failed to update the score" }, status: 403
    end
  end
  def destroy

    @rule = Rule.find(params[:id])
    if @rule.user == current_user
      if @rule.destroy
        flash[:success] = "Destroyed!"
        redirect_to rules_path()
      else
        flash[:error] = "Failed to destroy the rule."
        redirect_to rules_path()
      end

    else
      flash[:error] = "You cannot destroy others' rule."
      redirect_to rules_path()
    end
  end

private
  def rule_params
    params.require(:rule).permit(:name, :script, :score)
  end

  def where_to_return(return_to, rule)
    if return_to == "rules_path"
      rules_path()
    elsif return_to == "making_with_rule_path"
      making_rules_path(rule)
    end
  end

end
